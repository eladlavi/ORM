using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ORM
{
    public class User
    {
        public string Username { get; set; }
        public int Role { get; set; }

        public User(string username, int role)
        {
            Username = username;
            Role = role;
        }
    }
}
