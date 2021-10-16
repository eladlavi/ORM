using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Data.SqlClient;

namespace ORM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DataController : ControllerBase
    {

        [HttpGet("getAllData")]
        public string GetAllData(string username, string password, string organizationId)
        {
            if (!UsersController.validLogin(username, password, organizationId, 10))
                return null;

            TablesController tablesController = new TablesController();
            List<Table> tables = tablesController.GetTables(username, password, organizationId);
            Dictionary<string, object> allData = new Dictionary<string, object>();
            foreach (Table table in tables)
            {
                string sql = "SELECT ";
                for (int i = 0; i < table.Columns.Count; i++)
                {
                    if (i > 0)
                        sql += ",";
                    sql += table.Columns[i].Name;
                }
                sql += " FROM t_" + organizationId + "_" + table.Name;
                List<Dictionary<string, object>> tableData = new List<Dictionary<string, object>>();
                DB.Select(sql, (cmd) => { }, (dr) =>
                {
                    Dictionary<string, object> objectData = new Dictionary<string, object>();
                    for (int i = 0; i < table.Columns.Count; i++)
                    {
                        object obj = null;
                        switch (table.Columns[i].DataType)
                        {
                            case "varchar":
                                obj = dr.GetString(i);
                                break;
                            case "int":
                                obj = dr.GetInt32(i);
                                break;
                            case "bit":
                                obj = dr.GetBoolean(i);
                                break;
                            case "bigint":
                                obj = dr.GetInt64(i);
                                break;
                            case "float":
                                obj = dr.GetDouble(i);
                                break;


                        }
                        objectData[table.Columns[i].Name] = obj;
                    }
                    tableData.Add(objectData);
                });

                allData[table.Name] = tableData;
            }

            return Newtonsoft.Json.JsonConvert.SerializeObject(allData).ToString();
        }


        [HttpPost("addData")]
        public int addData(string username, string password, string organizationId, string tableName, [FromBody] Dictionary<string, object> objectData)
        {
            if (!UsersController.validLogin(username, password, organizationId, 5))
                return -1;


            //load the structure of the table:

            List<Column> columns = getColumnsOfTable(organizationId, tableName);



            //build the SQL statement:
            List<SqlParameter> sqlParameters = new List<SqlParameter>();
            string sqlCols = "";
            string sqlValues = "";
            for (int i = 0; i < columns.Count; i++)
            {
                Column column = columns[i];

                if (objectData.ContainsKey(column.Name))
                {
                    JsonElement jsonElement = (JsonElement)objectData[column.Name];
                    if (sqlCols.Length > 0)
                    {
                        sqlCols += ",";
                        sqlValues += ",";
                    }

                    sqlCols += column.Name;
                    sqlValues += "@" + column.Name;

                    object obj = null;
                    switch (column.DataType)
                    {
                        case "varchar":
                            obj = jsonElement.GetString();
                            break;
                        case "int":
                            obj = jsonElement.GetInt32();
                            break;
                        case "bit":
                            obj = jsonElement.GetBoolean();
                            break;
                        case "bigint":
                            obj = jsonElement.GetInt64();
                            break;
                        case "float":
                            obj = jsonElement.GetDouble();
                            break;
                    }
                    SqlParameter sqlParameter = new SqlParameter("@" + column.Name, obj);
                    sqlParameters.Add(sqlParameter);
                }
                else if (!column.IsNullable && column.Name != "id")
                {
                    //we prevent an attempt to insert row if a column is mandatory but is not supplied.
                    return -2;
                }

            }
            string sql = "INSERT INTO t_" + organizationId + "_" + tableName + "(" + sqlCols + ") output INSERTED.ID VALUES (" + sqlValues + ")";


            //execute the insert statement.
            //does NOT check foreign key constraints in advance.
            return DB.Update(sql, (cmd) =>
            {
                foreach (SqlParameter sqlParameter in sqlParameters)
                    cmd.Parameters.Add(sqlParameter);
            }, true);
        }


        [HttpGet("deleteData")]
        public bool DeleteData(string username, string password, string organizationId, string tableName, int id)
        {
            if (!UsersController.validLogin(username, password, organizationId, 5))
                return false;

            return DB.Update("DELETE FROM t_" + organizationId + "_" + tableName + " WHERE id=@id", (cmd) =>
            {
                cmd.Parameters.AddWithValue("@id", id);
            }) == 1;

        }


        private List<Column> getColumnsOfTable(string organizationId, string tableName)
        {
            
            List<Column> columns = new List<Column>();
            DB.Select("SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION, COLUMN_DEFAULT, DATA_TYPE, IS_NULLABLE, CHARACTER_OCTET_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='t_" + organizationId + "_" + tableName + "' ORDER BY ORDINAL_POSITION", (cmd) =>
            {

            }, (dr) =>
            {
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
                columns.Add(column);

            });
            return columns;
        }

        [HttpPost("updateData")]
        public bool updateData(string username, string password, string organizationId, string tableName, [FromBody] Dictionary<string, object> objectData)
        {
            if (!UsersController.validLogin(username, password, organizationId, 5))
                return false;


            //load the structure of the table:
            List<Column> columns = getColumnsOfTable(organizationId, tableName);



            //build the SQL statement:
            List<SqlParameter> sqlParameters = new List<SqlParameter>();
            string sqlCols = "";
            for (int i = 0; i < columns.Count; i++)
            {
                Column column = columns[i];

                if (objectData.ContainsKey(column.Name))
                {
                    JsonElement jsonElement = (JsonElement)objectData[column.Name];
                    if(column.Name == "id")
                    {
                        int id = jsonElement.GetInt32();
                        sqlParameters.Add(new SqlParameter("@id", id));
                    }
                    else
                    {
                        if (sqlCols.Length > 0)
                        {
                            sqlCols += ",";
                        }

                        sqlCols += column.Name + "=" + "@" + column.Name;


                        object obj = null;
                        int id = 0;
                        switch (column.DataType)
                        {
                            case "varchar":
                                obj = jsonElement.GetString();
                                break;
                            case "int":
                                obj = jsonElement.GetInt32();
                                break;
                            case "bit":
                                obj = jsonElement.GetBoolean();
                                break;
                            case "bigint":
                                obj = jsonElement.GetInt64();
                                break;
                            case "float":
                                obj = jsonElement.GetDouble();
                                break;
                        }
                        SqlParameter sqlParameter = new SqlParameter("@" + column.Name, obj);
                        sqlParameters.Add(sqlParameter);
                    }
                    
                }
                else if (!column.IsNullable && column.Name != "id")
                {
                    //we prevent an attempt to insert row if a column is mandatory but is not supplied.
                    return false;
                }

            }
            string sql = "UPDATE t_" + organizationId + "_" + tableName + " SET " + sqlCols + " WHERE id=@id";


            //execute the insert statement.
            //does NOT check foreign key constraints in advance.
            return DB.Update(sql, (cmd) =>
            {
                foreach (SqlParameter sqlParameter in sqlParameters)
                    cmd.Parameters.Add(sqlParameter);
            }) == 1;
        }

    }
}
