const allData = {};
let formControls = {};
let rowToUpdate = null;
function loadAllData() {
    btnReloadTablesClicked(() => {
        //addData(tables[0].name, { col2: "test1", y: 20 });
        removeAllChildNodes(ddTables2);
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            let optionTable = document.createElement('option');
            optionTable.innerHTML = table.name;
            if (recentSelectedTable === table.name)
                optionTable.selected = true;
            ddTables2.appendChild(optionTable);
        }

        let elements = [btnReloadData, ddTables2];
        disable(elements);
        sendHttpRequest("api/data/getAllData?username=" + username + "&password=" + password + "&organizationId=" + organizationId, (success, response) => {
            enable(elements);
            if (success) {
                let loadedData = JSON.parse(response);
                for (const table in allData) {
                    delete allData[table];
                }
                for (const loadedTable in loadedData) {
                    allData[loadedTable] = loadedData[loadedTable];
                }
                ddTables2Changed();
                lblDataMessage.innerHTML = "";
            } else {
                lblDataMessage.innerHTML = "some error loading data...";
            }

        });
        
    });
}


function addData(tableName, obj) {
    lblDataMessage.innerHTML = "please wait...";
    let elements = [btnSave, ddTables2];
    disable(elements);
    sendHttpRequest("api/data/addData?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName, (success, response) => {
        enable(elements);
        if (success && response.length > 0) {
            let rowId = parseInt(response);
            if (rowId > 0) {
                lblDataMessage.innerHTML = "";
                //loadAllData();
                obj["id"] = rowId;
                allData[tableName].push(obj);
                ddTables2Changed();
            }
        } else {
            lblDataMessage.innerHTML = "some error adding new data.";
        }
    }, JSON.stringify(obj), (httpRequest) => {
        httpRequest.setRequestHeader("Content-Type", "application/json");
    });
}

function ddTables2Changed() {
    recentSelectedTable = ddTables2.value;
    
    selectedTable = null;
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name == recentSelectedTable) {
            selectedTable = tables[i];
            break;
        }
    }
    if (selectedTable) {
        removeAllChildNodes(divTable);
        let tblData = document.createElement('table');
        let trHeader = document.createElement('tr');
        for (let i = 0; i < selectedTable.columns.length; i++) {
            let th = document.createElement('th');
            th.innerHTML = selectedTable.columns[i].name;
            trHeader.appendChild(th);
        }
        let thButtons = document.createElement('th');
        thButtons.innerHTML = "";
        trHeader.appendChild(thButtons);
        tblData.appendChild(trHeader);
        
        let data = allData[selectedTable.name];
        for (let i = 0; i < data.length; i++) {
            let tr = document.createElement('tr');
            for (let j = 0; j < selectedTable.columns.length; j++) {
                let td = document.createElement('td');
                td.innerHTML = data[i][selectedTable.columns[j].name];
                tr.appendChild(td);
            }
            let tdButtons = document.createElement('td');
            let btnDeleteRow = document.createElement('button');
            btnDeleteRow.innerHTML = 'delete';
            btnDeleteRow.rowId = i;
            btnDeleteRow.onclick = (event) => {
                let rowId = event.target.rowId;
                let rowToDelete = allData[selectedTable.name][rowId];
                lblDataMessage.innerHTML = "please wait...";

                sendHttpRequest('api/data/deleteData?username=' + username + '&password=' + password + '&organizationId=' + organizationId + '&tableName='  + selectedTable.name + '&id=' + rowToDelete.id, (success, response) => {
                    if (success && response === 'true') {
                        let data = allData[selectedTable.name];
                        data.splice(rowId, 1);
                        ddTables2Changed();
                        lblDataMessage.innerHTML = "deleted.";
                    } else {
                        lblDataMessage.innerHTML = "error";
                    }
                });
            };
            tdButtons.appendChild(btnDeleteRow);
            let btnEdit = document.createElement('button');
            btnEdit.innerHTML = 'edit';
            btnEdit.rowId = i;
            btnEdit.onclick = () => {
                let rowId = event.target.rowId;
                rowToUpdate = allData[selectedTable.name][rowId];
                for (let i = 0; i < selectedTable.columns.length; i++) {
                    let column = selectedTable.columns[i];
                    let txtInput = formControls[column.name];
                    if (column.foreginKeyTable) {
                        txtInput.value = rowToUpdate[column.name];
                    } else {
                        switch (column.dataType) {
                            case "varchar":
                                txtInput.value = rowToUpdate[column.name];

                                break;
                            case "int":
                                txtInput.value = rowToUpdate[column.name].toString();
                                break;
                            case "bit":
                                txtInput.checked = rowToUpdate[column.name];
                                break;
                            case "bigint":
                                txtInput.value = rowToUpdate[column.name].toString();
                                break;
                            case "float":
                                txtInput.value = rowToUpdate[column.name].toString();
                                break;

                        }
                    }

                }
                
            };
            tdButtons.appendChild(btnEdit);
            tr.appendChild(tdButtons);
            tblData.appendChild(tr);
        }
        divTable.appendChild(tblData);
        renderEditDataForm();

        
    }

    function renderEditDataForm() {
        removeAllChildNodes(divEditData);
        for (formControl in formControls) {
            delete formControls[formControl];
        }
        for (let i = 0; i < selectedTable.columns.length; i++) {
            let pField = document.createElement('p');
            let lblColumnName = document.createElement('label');
            let column = selectedTable.columns[i];
            lblColumnName.innerHTML = column.name;
            pField.appendChild(lblColumnName);
            let txtInput;
            
            if (column.foreginKeyTable) {
                
                txtInput = document.createElement('select');
                let foreginTableData = allData[column.foreginKeyTable];
                for (let j = 0; j < foreginTableData.length; j++) {
                    let option = document.createElement('option');
                    let description = foreginTableData[j]['id'].toString();

                    //if there's at least one column, besides id, in the foreign table,
                    //takes the second column as additional description to the id:
                    let foreignTable = tableByName(column.foreginKeyTable);
                    if (foreignTable.columns.length > 1) {
                        description += " " + foreginTableData[j][foreignTable.columns[1].name];
                    }
                    option.innerHTML = description;
                    option.value = foreginTableData[j]['id'];
                    txtInput.appendChild(option);
                }
            } else {
                txtInput = document.createElement('input');
                switch (column.dataType) {
                    case "varchar":
                        txtInput.type = "text";
                        if (column.defaultValue) {
                            let val = column.defaultValue.substring(2, column.defaultValue.indexOf("')"));
                            txtInput.value = val;
                        }
                        break;
                    case "int":
                        txtInput.type = "number";
                        if (column.name === "id")
                            txtInput.disabled = true;
                        if (column.defaultValue && column.defaultValue !== "(NULL)") {
                            let val = column.defaultValue.substring(2, column.defaultValue.indexOf("))"));
                            txtInput.value = val.toString();
                        }
                        break;
                    case "bit":
                        txtInput.type = "checkbox";
                        break;
                    case "bigint":
                        txtInput.type = "number";
                        if (column.defaultValue && column.defaultValue !== "(NULL)") {
                            let val = column.defaultValue.substring(2, column.defaultValue.indexOf("))"));
                            txtInput.value = val.toString();
                        }
                        break;
                    case "float":
                        txtInput.type = "number";
                        txtInput.step = 0.1;
                        if (column.defaultValue && column.defaultValue !== "(NULL)") {
                            let val = column.defaultValue.substring(2, column.defaultValue.indexOf("))"));
                            txtInput.value = val.toString();
                        }
                        break;

                }
                
            }
            formControls[column.name] = txtInput;
            pField.appendChild(txtInput);
            divEditData.appendChild(pField);
        }
    }
}


function updateData(tableName, obj) {

    lblDataMessage.innerHTML = "please wait...";
    sendHttpRequest('api/data/updateData?username=' + username + '&password=' + password + '&organizationId=' + organizationId + '&tableName=' + tableName, (success, response) => {
        if (success && response === 'true') {
            for (let i = 0; i < selectedTable.columns.length; i++) {
                let column = selectedTable.columns[i];
                if (column.name != "id") {
                    rowToUpdate[column.name] = obj[column.name];
                }
            }
            rowToUpdate = null;
            ddTables2Changed();
            lblDataMessage.innerHTML = "updated.";
        } else {
            lblDataMessage.innerHTML = "error";
        }
    }, JSON.stringify(obj), (httpRequest) => {
        httpRequest.setRequestHeader("Content-Type", "application/json");
    });

}

function btnSaveClicked() {
    if (selectedTable) {
        let obj = {};
        for (let i = 0; i < selectedTable.columns.length; i++) {
            let column = selectedTable.columns[i];
            let txtInput = formControls[column.name];
            let val = null;
            switch (column.dataType) {
                case "varchar":
                    val = txtInput.value;
                    obj[column.name] = val;
                    break;
                case "int":
                    val = txtInput.value;
                    if (val.length > 0) {
                        val = parseInt(val);
                        obj[column.name] = val;
                    } else {
                        if (!column.isNullable && column.name != "id") {
                            lblDataMessage.innerHTML = "field " + column.name + " is required";
                            return;
                        }
                    }
                    break;
                case "bit":
                    val = txtInput.checked;
                    obj[column.name] = val;
                    break;
                case "bigint":
                    val = txtInput.value;
                    if (val.length > 0) {
                        val = parseInt(val);
                        obj[column.name] = val;
                    } else {
                        if (!column.isNullable) {
                            lblDataMessage.innerHTML = "field " + column.name + " is required";
                            return;
                        }
                    }
                    break;
                case "float":
                    val = txtInput.value;
                    if (val.length > 0) {
                        val = parseFloat(val);
                        obj[column.name] = val;
                    } else {
                        if (!column.isNullable) {
                            lblDataMessage.innerHTML = "field " + column.name + " is required";
                            return;
                        }
                    }
                    break;

            }
        }
        if (formControls["id"].value) {
            updateData(selectedTable.name, obj);
        } else {
            addData(selectedTable.name, obj);
        }
    }
}