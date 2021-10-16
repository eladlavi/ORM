using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace ORM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TablesController : ControllerBase
    {
        [HttpGet("getTables")]
        public List<Table> GetTables(string username, string password, string organizationId)
        {
            if (!UsersController.validLogin(username, password, organizationId, 10))
                return null;

            List<Table> tables = new List<Table>();
            string currentTableName = "";
            Table currentTable = null;
            DB.Select("SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_DEFAULT, DATA_TYPE, IS_NULLABLE, CHARACTER_OCTET_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE 't_" + organizationId + "_%' ORDER BY TABLE_NAME, ORDINAL_POSITION", (cmd) =>
            {

            }, (dr) =>
            {
                if (dr.GetString(0) != currentTableName)
                {
                    currentTableName = dr.GetString(0);
                    currentTable = new Table();
                    string prefix = "t_" + organizationId + "_";
                    currentTable.Name = currentTableName.Substring(prefix.Length);
                    currentTable.Columns = new List<Column>();
                    tables.Add(currentTable);
                }
                Column column = new Column();
                column.Name = dr.GetString(1);
                column.DataType = dr.GetString(4);
                column.IsNullable = dr.GetString(5) == "YES";
                if (!dr.IsDBNull(6))
                {
                    column.CharacterLength = dr.GetInt32(6);
                }
                if (dr.IsDBNull(3))
                {
                    column.DefaultValue = null;
                }
                else
                {
                    column.DefaultValue = dr.GetString(3);
                }
                column.OrdinalPosition = dr.GetInt32(2);
                currentTable.Columns.Add(column);

            });
            DB.Select("SELECT CONSTRAINT_NAME, TABLE_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' AND TABLE_NAME LIKE 't_"+organizationId+"_%';", (cmd)=> { }, (dr)=> {
                string[] parts = dr.GetString(0).Split("_");
                string columnName = parts[3];
                string foreignTable = parts[4];
                for (int i = 0; i < tables.Count; i++)
                {
                    if(tables[i].Name == parts[2])
                    {

                        for (int j = 0; j < tables[i].Columns.Count; j++)
                        {
                            if(tables[i].Columns[j].Name == columnName)
                            {
                                tables[i].Columns[j].ForeginKeyTable = foreignTable;
                                break;
                            }
                        }
                        break;
                    }
                }
            });
            return tables;
        }


        [HttpGet("createTable")]
        public bool CreateTable(string username, string password, string organizationId, string tableName)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;
            try
            {
                return DB.Update("CREATE TABLE t_" + organizationId + "_" + tableName + " (id INT NOT NULL PRIMARY KEY IDENTITY(1,1))", (cmd) => { }) == -1;

            }
            catch (SqlException ex)
            {
                if (ex.Message.StartsWith("There is already"))
                    return false;
            }
            return false;
        }


        [HttpGet("addColumn")]
        public bool AddColumn(string username, string password, string organizationId, string tableName, string columnName, string dataType, bool isNullable, string defaultValue)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;
            if (dataType == "varchar")
            {
                dataType = "varchar(20)";
                if (!string.IsNullOrEmpty(defaultValue))
                    defaultValue = "'" + defaultValue + "'";
            }

                
            return DB.Update("ALTER TABLE t_"+organizationId+"_"+tableName+" ADD "+columnName+" "+dataType+" " + (isNullable ? "NULL" : "NOT NULL") + " CONSTRAINT DF_t_"+organizationId+"_"+tableName+"_"+columnName+" DEFAULT " + (string.IsNullOrEmpty(defaultValue) ? "NULL" : defaultValue), (cmd)=> { }) == -1;
        }

        [HttpGet("dropColumn")]
        public bool DropColumn(string username, string password, string organizationId, string tableName, string columnName)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;
            


            return DB.Update("ALTER TABLE t_"+organizationId+"_" + tableName + " DROP CONSTRAINT DF_t_" + organizationId+"_"+tableName+"_"+columnName+";ALTER TABLE t_"+organizationId+"_" + tableName + " DROP COLUMN " + columnName, (cmd) => { }) == -1;
        }

        [HttpGet("dropTable")]
        public bool DropTable(string username, string password, string organizationId, string tableName)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;



            return DB.Update("DROP TABLE t_"+organizationId+"_" + tableName, (cmd) => { }) == -1;
        }


        [HttpGet("addForeginKey")]
        public bool AddForeginKey(string username, string password, string organizationId, string tableName, string foreignTableName, string columnName)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;



            return DB.Update("ALTER TABLE t_"+ organizationId + "_" + tableName + " ADD CONSTRAINT FK_"+organizationId+"_"+tableName+"_"+columnName+"_"+foreignTableName+ " FOREIGN KEY (" + columnName + ") REFERENCES t_"+ organizationId + "_" + foreignTableName+"(id)", (cmd) => { }) == -1;
        }

        [HttpGet("dropForeginKey")]
        public bool DropForeginKey(string username, string password, string organizationId, string tableName, string foreignTableName, string columnName)
        {
            if (!UsersController.validLogin(username, password, organizationId, 1))
                return false;



            return DB.Update("ALTER TABLE t_" + organizationId + "_" + tableName + " DROP CONSTRAINT FK_" + organizationId + "_" + tableName + "_" + columnName + "_" + foreignTableName, (cmd) => { }) == -1;
        }

    }
}
