let tables = [];
let recentSelectedTable = "";
let selectedTable = null;
let selectedColumn = null;


function btnReloadTablesClicked(callback) {
    sendHttpRequest("api/tables/getTables?username=" + username + "&password=" + password + "&organizationId=" + organizationId, (success, response) => {
        if (success) {
            tables.length = 0;
            removeAllChildNodes(ddTables);
            removeAllChildNodes(ddTables2);
            removeAllChildNodes(ddForeginKeyTables);
            let loadedTables = JSON.parse(response);
            for (let i = 0; i < loadedTables.length; i++) {
                let table = loadedTables[i];
                let optionTable = document.createElement('option');
                optionTable.innerHTML = table.name;
                if (recentSelectedTable === table.name)
                    optionTable.selected = true;
                ddTables.appendChild(optionTable);
                let optionTable2 = document.createElement('option');
                optionTable2.innerHTML = table.name;
                ddForeginKeyTables.appendChild(optionTable2);
                tables.push(table);
            }
            ddTablesChanged();
            if (callback)
                callback();
        }
    });
}

function tableByName(tableName) {
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name === tableName)
            return tables[i];
    }
    return null;
}

function ddTablesChanged() {
    recentSelectedTable = ddTables.value;
    removeAllChildNodes(ddColumns);
    selectedTable = null;
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name == recentSelectedTable) {
            selectedTable = tables[i];
            break;
        }
    }
    if (selectedTable) {
        let columns = selectedTable.columns;
        for (let i = 0; i < columns.length; i++) {
            let option = document.createElement('option');
            option.innerHTML = columns[i].name;
            if (selectedColumn && columns[i].name === selectedColumn.name)
                option.selected = true;
            ddColumns.appendChild(option);
        }
        ddColumnsChanged();
    }
}

function btnCreateTableClicked() {
    let newTableName = txtNewTableName.value;
    if (newTableName.length == 1) {
        lblDesignDatabaseMessage.innerHTML = "must enter a name for the new table";
        return;
    }
    let alreadyExists = false;
    for (let i = 0; i < tables.length; i++) {
        if (tables[i].name === newTableName) {
            alreadyExists = true;
            break;
        }
    }
    if (alreadyExists) {
        lblDesignDatabaseMessage.innerHTML = "there is already such table exists";
        return;
    }
    let elements = [txtNewTableName, btnCreateTable];
    disable(elements);
    sendHttpRequest("api/tables/createTable?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + newTableName, (success, response) => {
        enable(elements);
        if (success) {
            if (response === "true") {
                lblDesignDatabaseMessage.innerHTML = "table create success";
                txtNewTableName.value = "";
                recentSelectedTable = newTableName;
                btnReloadTablesClicked();
            } else {
                lblDesignDatabaseMessage.innerHTML = "table create failed";
            }
        } else {
            lblDesignDatabaseMessage.innerHTML = "some error occured...";
        }
    });
}

function addNewColumnClicked() {
    let columnName = txtNewColumnName.value;
    if (columnName.length == 0) {
        lblDesignDatabaseMessage.innerHTML = "must enter column name";
        return;
    }
    let dataType = ddDataType.value;
    let isNullable = chkIsNullable.checked;
    let defaultValue = txtDefaultValue.value;
    let elements = [txtNewColumnName, ddDataType, chkIsNullable, txtDefaultValue, btnAddNewColumn];
    let tableName = ddTables.value;
    let alreadyExists = false;
    for (let i = 0; i < selectedTable.columns.length; i++) {
        let column = selectedTable.columns[i];
        if (column.name === columnName) {
            alreadyExists = true;
            break;
        }
    }
    if (alreadyExists) {
        lblDesignDatabaseMessage.innerHTML = "such column already exists.";
        return;
    }
    disable(elements);
    lblDesignDatabaseMessage.innerHTML = "please wait...";
    sendHttpRequest("api/tables/addColumn?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName + "&columnName=" + columnName + "&dataType=" + dataType + "&isNullable=" + isNullable + "&defaultValue=" + defaultValue, (success, response) => {
        enable(elements);
        if (success) {
            if (response === "true") {
                lblDesignDatabaseMessage.innerHTML = "column added.";
                txtNewColumnName.value = "";
                btnReloadTablesClicked();
            } else {
                lblDesignDatabaseMessage.innerHTML = "could not add column";
            }
        } else {
            lblDesignDatabaseMessage.innerHTML = "some error occured with adding column...";
        }

    });

}

function ddColumnsChanged() {
    if (!selectedTable)
        return;
    selectedColumn = null;
    for (let i = 0; i < selectedTable.columns.length; i++) {
        let column = selectedTable.columns[i];
        if (column.name == ddColumns.value) {
            selectedColumn = column;
            break;
        }
    }
    if (selectedColumn) {
        let dataTypeName = "";
        switch (selectedColumn.dataType) {
            case "varchar":
                dataTypeName = "text";
                break;
            case "int":
                dataTypeName = "integer";
                break;
            case "real":
                dataTypeName = "real";
                break;
            case "bit":
                dataTypeName = "yes/no";
                break;
            default:
                dataTypeName = "unknown";
        }
        lblDataType.innerHTML = dataTypeName;
        lblOrdinalPosition.innerHTML = selectedColumn.ordinalPosition;
        lblIsNullable.innerHTML = selectedColumn.isNullable ? "yes" : "no";
        lblCharacterLength.innerHTML = selectedColumn.characterLength;
        if (selectedColumn.foreginKeyTable) {
            lblForeignKey.innerHTML = selectedColumn.foreginKeyTable;
            btnDropForeginKey.disabled = false;
        } else {
            lblForeignKey.innerHTML = "";
            btnDropForeginKey.disabled = true;
        }
        
    }
}

function btnDropColumnClicked() {
    let selectedColumn = ddColumns.value;
    let tableName = ddTables.value;
    if (confirm("are you sure you wish to delete column " + selectedColumn + "?")) {
        let elements = [btnDropColumn, ddColumns];
        disable(elements);
        lblDesignDatabaseMessage.innerHTML = "please wait...";
        sendHttpRequest("api/tables/dropColumn?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName + "&columnName=" + selectedColumn, (success, response) => {
            enable(elements);
            if (success) {
                if (response === "true") {
                    lblDesignDatabaseMessage.innerHTML = "column dropped...";
                    btnReloadTablesClicked();
                } else {
                    lblDesignDatabaseMessage.innerHTML = "could not delete column...";
                }
            } else {
                lblDesignDatabaseMessage.innerHTML = "some error occured with dropping column...";
            }

        });
    }
}

function btnDropTableClicked() {
    let tableName = ddTables.value;
    if (confirm("are you sure? ALL DATA wil be LOST in " + tableName)) {
        
        let elements = [ddTables, btnDropTable];
        disable(elements);
        lblDesignDatabaseMessage.innerHTML = "please wait...";
        sendHttpRequest("api/tables/dropTable?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName, (success, response) => {
            enable(elements);
            if (success) {
                if (response === "true") {
                    lblDesignDatabaseMessage.innerHTML = "table dropped...";
                    btnReloadTablesClicked();
                }
            } else {
                lblDesignDatabaseMessage.innerHTML = "some error occured with dropping table...";
            }
        });
    }
}

function btnAddForeignKeyClicked() {
    let selectedForeignTable = ddForeginKeyTables.value;
    let tableName = ddTables.value;
    
    if (selectedColumn) {
        if (selectedColumn.dataType === "int") {
            let elements = [ddForeginKeyTables, btnAddForeignKey];
            disable(elements);
            lblDesignDatabaseMessage.innerHTML = "please wait..";
            sendHttpRequest("api/tables/addForeginKey?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName + "&foreignTableName=" + selectedForeignTable + "&columnName=" + selectedColumn.name, (success, response) => {
                enable(elements);
                if (success && response === "true") {
                    lblDesignDatabaseMessage.innerHTML = "foreign key added successfully.";
                    btnReloadTablesClicked();
                } else {
                    lblDesignDatabaseMessage.innerHTML = "error adding foreign key..";
                }
            });
        } else {
            lblDesignDatabaseMessage.innerHTML = "only integer columns are allowed..";
        }
        
    }
}


function btnDropForeginKeyClicked() {
    let tableName = ddTables.value;
    let elements = [btnDropForeginKey, ddColumns, ddTables];
    disable(elements);
    lblDesignDatabaseMessage.innerHTML = "please wait...";
    sendHttpRequest("api/tables/dropForeginKey?username=" + username + "&password=" + password + "&organizationId=" + organizationId + "&tableName=" + tableName + "&foreignTableName=" + selectedColumn.foreginKeyTable + "&columnName=" + selectedColumn.name, (success, response) => {
        enable(elements);
        if (success && response === "true") {
            lblDesignDatabaseMessage.innerHTML = "foreign key dropped.";
            btnReloadTablesClicked();
        } else {
            lblDesignDatabaseMessage.innerHTML = "some error dropping this forein key...";
        }

    });
}