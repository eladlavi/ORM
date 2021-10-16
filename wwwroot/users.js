const users = [];
let selectedUserName = "";
let selectedUser = null;

function loginSignup(isLogin) {
    username = txtUsername.value;
    password = txtPassword.value;
    organizationId = txtOrganization.value;
    lblLoginMessage.innerHTML = "";
    if (username.length == 0 || password.length == 0 || organizationId.length == 0) {
        lblLoginMessage.innerHTML = "must enter username, password and orgranization";
        return
    }
    let elements = [btnLogin, btnSignup, txtUsername, txtPassword, txtOrganization];
    disable(elements);
    sendHttpRequest("api/users/" + (isLogin ? "login" : "signup") + "?username=" + username + "&password=" + password + "&organizationId=" + organizationId, (success, response) => {
        enable(elements);
        if (success) {
            if (response === "true") {
                lblLoginMessage.innerHTML = "logged in";
                txtPassword.value = "";
                divLogin.classList.add('hidden');
                divMain.classList.remove('hidden');
                
                btnShowUsers();
                
            } else if (response === "false") {
                lblLoginMessage.innerHTML = "invalid credentials";
            } else {
                lblLoginMessage.innerHTML = "error";
            }
        } else {
            lblLoginMessage.innerHTML = "communication error";
        }

    });

}


function loadUsers() {
    removeAllChildNodes(ddUsers);
    users.length = 0;
    let elements = [ddUsers, btnReloadUsers, btnDeleteUser, btnResetPassword, txtRole, btnChangeRole];
    disable(elements);
    sendHttpRequest("api/users/getUsers?username=" + username + "&password=" + password + "&organizationId=" + organizationId, (success, response) => {
        enable(elements);
        if (success) {
            if (response.length) {
                let loadedUsers = JSON.parse(response);
                for (let i = 0; i < loadedUsers.length; i++) {
                    let user = loadedUsers[i];
                    users.push(user);
                    let userOption = document.createElement('option');
                    userOption.value = user.username;
                    userOption.innerHTML = user.username;
                    if (selectedUserName === user.username)
                        userOption.selected = true;
                    ddUsers.appendChild(userOption);

                }
                ddUsersChanged();
            }
        }
    });
}

function btnAddUserClicked() {
    let userToAdd = txtNewUsername.value;
    if (userToAdd.length == 0) {
        lblUsersMessage.innerHTML = "please type username first";
        return;
    }
    let elements = [btnAddUser, txtNewUsername];
    let alreadyExists = false;
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === userToAdd) {
            alreadyExists = true;
            break;
        }
    }
    if (alreadyExists) {
        lblUsersMessage.innerHTML = "there is already such user exists";
        return;
    }
    lblUsersMessage.innerHTML = "please wait...";
    disable(elements);
    sendHttpRequest("api/users/addUser?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&userToAdd=" + userToAdd, (success, response) => {
        enable(elements);
        
        if (success) {
            if (response === 'true') {
                lblUsersMessage.innerHTML = "user added";
                txtNewUsername.value = "";
                loadUsers();
            } else {
                lblUsersMessage.innerHTML = "unexpected result";
            }
        } else {
            lblUsersMessage.innerHTML = "error adding user";
        }

    });
}


function btnDeleteUserClicked() {
    let userToDelete = ddUsers.value;
    let elements = [btnDeleteUser, ddUsers];
    lblUsersMessage.innerHTML = "please wait...";
    disable(elements);
    sendHttpRequest("api/users/deleteUser?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&userToDelete=" + userToDelete, (success, response) => {
        enable(elements);

        if (success) {
            if (response === 'true') {
                lblUsersMessage.innerHTML = "user deleted";
                loadUsers();
            } else {
                lblUsersMessage.innerHTML = "unexpected result";
            }
        } else {
            lblUsersMessage.innerHTML = "error deleting user";
        }

    });
}

function btnResetPasswordClicked() {
    let userToReset = ddUsers.value;
    let elements = [btnResetPassword, ddUsers];
    lblUsersMessage.innerHTML = "please wait...";
    disable(elements);
    sendHttpRequest("api/users/resetPassword?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&userToReset=" + userToReset, (success, response) => {
        enable(elements);

        if (success) {
            if (response === 'true') {
                lblUsersMessage.innerHTML = "password reset";
                loadUsers();
            } else {
                lblUsersMessage.innerHTML = "unexpected result";
            }
        } else {
            lblUsersMessage.innerHTML = "error reseting password";
        }

    });
}


function btnSetMyPasswordClicked() {
    let newPassword = txtNewPassword.value;
    if (newPassword.length == 0) {
        lblUsersMessage.innerHTML = "please type new password first...";
        return;
    }
    let elements = [btnSetMyPassword, txtNewPassword];
    lblUsersMessage.innerHTML = "please wait...";
    disable(elements);
    sendHttpRequest("api/users/changePassword?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&newPassword=" + newPassword, (success, response) => {
        enable(elements);

        if (success) {
            if (response === 'true') {
                lblUsersMessage.innerHTML = "password changed.";
                password = newPassword;
            } else {
                lblUsersMessage.innerHTML = "unexpected result";
            }
        } else {
            lblUsersMessage.innerHTML = "error changing password";
        }

    });
}

function btnChangeRoleClicked() {
    let newRole = txtRole.value;
    let usernameToChangeRole = ddUsers.value;
    if (newRole.length == 0) {
        lblUsersMessage.innerHTML = "please enter a role first.";
        return;
    }
    let elements = [txtRole, btnChangeRole, ddUsers];
    lblUsersMessage.innerHTML = "please wait...";
    disable(elements);
    sendHttpRequest("api/users/changeRole?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&usernameToChangeRole=" + usernameToChangeRole + "&newRole=" + newRole, (success, response) => {
        enable(elements);

        if (success) {
            if (response === 'true') {
                lblUsersMessage.innerHTML = "role changed";
                txtRole.value = "";
                loadUsers();
            } else {
                lblUsersMessage.innerHTML = "unexpected result";
            }
        } else {
            lblUsersMessage.innerHTML = "error changing role";
        }

    });
}

function ddUsersChanged() {
    selectedUser = null;
    for (let i = 0; i < users.length; i++) {
        let user = users[i];
        if (user.username === ddUsers.value) {
            selectedUser = user;
            selectedUserName = user.username;
            break;
        }
    }
    if (selectedUser) {
        lblRole.innerHTML = selectedUser.role;
    }
}