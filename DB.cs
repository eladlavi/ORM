using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace ORM
{
    public static class DB
    {

        //connString should be set only once:
        private static string connString;
        public static string ConnString
        {
            get
            {
                return connString;
            }
            set
            {
                if (connString == null)
                    connString = value;
            }
        }

        public static void Select(string sql, Action<SqlCommand> configureCommand ,Action<SqlDataReader> callback)
        {
            using (SqlConnection conn = new SqlConnection(ConnString))
            {
                conn.Open();
                using(SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    configureCommand(cmd);
                    using(SqlDataReader dr = cmd.ExecuteReader())
                    {
                        while (dr.Read())
                        {
                            callback(dr);
                        }
                    }
                }
            }

        }

        public static int Update(string sql, Action<SqlCommand> configureCommand, bool executeScalar = false)
        {
            int rowsAffected = 0;
            using (SqlConnection conn = new SqlConnection(ConnString))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    configureCommand(cmd);
                    rowsAffected = executeScalar ? (int)cmd.ExecuteScalar() : cmd.ExecuteNonQuery();
                }
            }
            return rowsAffected;
        }
    }


    
}
