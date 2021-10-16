let username;
let password;
let organizationId;
let currentTab;


function sendHttpRequest(url, onComplete, body = null, setHeaders = null) {
    let httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function () {
        if (this.readyState == 4) {
            onComplete(this.status == 200,
                this.responseType !== "arraybuffer" ? this.responseText : this.response);
        }
    };

    if (body) {
        httpRequest.open('POST', url, true);
        if (setHeaders)
            setHeaders(httpRequest);
        httpRequest.send(body);
    } else {
        httpRequest.open('GET', url, true);
        if (setHeaders)
            setHeaders(httpRequest);
        httpRequest.send();
    }

}

function divLoginKeyPress(event) {
    if (event.keyCode === 13) {
        let id = event.target.id;
        switch (id) {
            case "txtUsername":
                txtPassword.focus();
                break;
            case "txtPassword":
                txtOrganization.focus();
                break;
            case "txtOrganization":
                btnLoginClicked();
                break;
        }
    }
    

    console.log(event.keyCode);
}

function init() {
    txtUsername.focus();

    //FOR DEBUG:
    /*
    txtUsername.value = 'elad';
    txtPassword.value = 'qwe123';
    txtOrganization.value = 'org1';
    btnLoginClicked();
    */
    
}


function btnLoginClicked() {
    loginSignup(true);
}

function btnSignupClicked() {
    loginSignup(false);
}

function enable(elements, val = false) {
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = val;

    }
}
function disable(elements) {
    enable(elements, true);
}




function removeAllChildNodes(node) {
    while (node.firstChild)
        node.removeChild(node.firstChild);
}

function btnShowUsers() {
    if (currentTab) {
        currentTab.classList.add('hidden');
    }
    loadUsers();
    currentTab = divUsers;
    currentTab.classList.remove('hidden');
}

function btnShowDesign() {
    if (currentTab) {
        currentTab.classList.add('hidden');
    }
    currentTab = divDesign;
    currentTab.classList.remove('hidden');
    btnReloadTablesClicked();
}

function btnShowData() {
    if (currentTab) {
        currentTab.classList.add('hidden');
    }
    currentTab = divData;
    currentTab.classList.remove('hidden');
    loadAllData();
}
