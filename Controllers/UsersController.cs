using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ORM.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        [HttpGet("login")]
        public bool Login(string username, string password, string organizationId)
        {
            return validLogin(username, password, organizationId, 10);
        }


        public static bool validLogin(string username, string password, string organizationId, int maxRole)
        {
            return DB.Update("UPDATE users SET last_login=@timestamp WHERE username=@username AND password=@password AND organization_id=@organization_id AND role<=@max_role",
                (cmd) =>
                {
                    cmd.Parameters.AddWithValue("@timestamp", DateTime.Now.Ticks);
                    cmd.Parameters.AddWithValue("@username", username);
                    cmd.Parameters.AddWithValue("@password", password);
                    cmd.Parameters.AddWithValue("@organization_id", organizationId);
                    cmd.Parameters.AddWithValue("@max_role", maxRole);
                }) == 1;
        }

        [HttpGet("signup")]
        public bool Signup(string username, string password, string organizationId)
        {
            bool alreadyExists = false;
            DB.Select("SELECT * FROM organizations WHERE organization_id=@organization_id",
                (cmd) => cmd.Parameters.AddWithValue("organization_id", organizationId),
                (dr) =>
                {
                    alreadyExists = true;
                });
            if (alreadyExists)
                return false;
            if (DB.Update("INSERT INTO organizations(organization_id) VALUES (@organization_id)",
                (cmd) => cmd.Parameters.AddWithValue("@organization_id", organizationId)) == 1)
            {
                return DB.Update("INSERT INTO users(username, password, organization_id, role) VALUES (@username, @password, @organization_id, 1)", (cmd) =>
                {
                    cmd.Parameters.AddWithValue("@username", username);
                    cmd.Parameters.AddWithValue("@password", password);
                    cmd.Parameters.AddWithValue("organization_id", organizationId);
                }) == 1;
            }
            return false;
        }


        [HttpGet("getUsers")]
        public List<User> GetUsers(string username, string password, string organizationId)
        {
            if (!validLogin(username, password, organizationId, 1))
                return null ;
            List<User> users = new List<User>();
            DB.Select("SELECT username, role FROM users WHERE organization_id=@organization_id", (cmd)=>cmd.Parameters.AddWithValue("@organization_id", organizationId), (dr)=> {
                users.Add(new ORM.User(dr.GetString(0), dr.GetInt32(1)));          
            
            });
            return users;
        }

        [HttpGet("deleteUser")]
        public bool DeleteUser(string username, string password, string organizationId, string userToDelete)
        {
            if (!validLogin(username, password, organizationId, 1))
                return false;
            return DB.Update("DELETE FROM users WHERE organization_id=@organization_id AND username=@user_to_delete", (cmd)=> {
                cmd.Parameters.AddWithValue("@organization_id", organizationId);
                cmd.Parameters.AddWithValue("@user_to_delete", userToDelete);
            }) == 1;
        }


        [HttpGet("addUser")]
        public bool AddUser(string username, string password, string organizationId, string userToAdd)
        {
            if (!validLogin(username, password, organizationId, 1))
                return false;
            return DB.Update("INSERT INTO users(organization_id,username,password,role) VALUES (@organization_id,@user_to_add,'12345',2)", (cmd) => {
                cmd.Parameters.AddWithValue("@organization_id", organizationId);
                cmd.Parameters.AddWithValue("@user_to_add", userToAdd);
            }) == 1;

        }


        [HttpGet("changePassword")]
        public bool ChangePassword(string username, string password, string organizationId,
            string newPassword)
        {
            if (!validLogin(username, password, organizationId, 10))
                return false;
            return DB.Update("UPDATE users SET password=@new_password WHERE organization_id=@organization_id AND username=@username", (cmd) =>
            {
                cmd.Parameters.AddWithValue("@organization_id", organizationId);
                cmd.Parameters.AddWithValue("@username", username);
                cmd.Parameters.AddWithValue("@new_password", newPassword);
            }) == 1;
        }


        [HttpGet("resetPassword")]
        public bool ResetPassword(string username, string password, string organizationId, 
            string userToReset)
        {
            if (!validLogin(username, password, organizationId, 1))
                return false;
            return DB.Update("UPDATE users SET password='12345' WHERE organization_id=@organization_id AND username=@user_to_reset", (cmd) =>
            {
                cmd.Parameters.AddWithValue("@organization_id", organizationId);
                cmd.Parameters.AddWithValue("@username", username);
                cmd.Parameters.AddWithValue("@user_to_reset", userToReset);
            }) == 1;
        }


        [HttpGet("changeRole")]
        public bool ChangeRole(string username, string password, string organizationId,
            string usernameToChangeRole, int newRole)
        {
            if (!validLogin(username, password, organizationId, 1))
                return false;
            return DB.Update("UPDATE users SET role=@new_role WHERE organization_id=@organization_id AND username=@username_to_change_role", (cmd) =>
            {
                cmd.Parameters.AddWithValue("@organization_id", organizationId);
                cmd.Parameters.AddWithValue("@username_to_change_role", usernameToChangeRole);
                cmd.Parameters.AddWithValue("@new_role", newRole);
            }) == 1;
        }
    }
}
