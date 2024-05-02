sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/Dialog',
    'sap/ui/core/library',
    'sap/m/Button',
    'sap/ui/core/IconPool',
    'sap/m/Bar',
    'sap/m/Title',
    "sap/ui/model/Filter",
    './xlsx/xlsx',
    './xlsx/xlsx.bundle'
], function (Controller, Fragment, JSONModel, MessageBox, MessageItem, MessageView, Dialog, coreLibrary, Button, IconPool, Bar, Title, Filter, XLSXjs, styleXLSXjs) {
    var TitleLevel = coreLibrary.TitleLevel;
    return {
        excelStyle : [],
        onInit: function () {
            /* Fragment.load({
                id: "zfbcttgtscd",
                name: "zfbcttgtscd.ext.fragment.BusyObject",
                type: "XML",
                controller: this
            })
                .then((oDialog) => {
                    this.zfbcttgtscdBusyDialog = oDialog;
                })
                .catch(error => {
                    MessageBox.error('Vui lòng tải lại trang')
                });

            var oMessageTemplate = new MessageItem({ // Message view template
                type: '{type}',
                title: '{message}',
                groupName: '{group}'
            });
            let thatController = this
            this.oCallApiMsgView = new MessageView({ //MessageView for response from Post FI Doc API
                showDetailsPageHeader: false, itemSelect: function () {
                    oBackButton.setVisible(true);
                },
                items: {
                    path: "/",
                    template: oMessageTemplate
                },
                groupItems: true
            })
            var oBackButton = new Button({
                icon: IconPool.getIconURI("nav-back"),
                visible: false,
                press: function () {
                    thatController.oCallApiMsgView.navigateBack();
                    this.setVisible(false);
                }
            });
            this.oCallApiMsgViewDialog = new Dialog({
                resizable: true,
                content: this.oCallApiMsgView,
                state: 'Information',
                beginButton: new Button({
                    press: function () {
                        this.getParent().close();
                    },
                    text: "Close"
                }),
                customHeader: new Bar({
                    contentLeft: [oBackButton],
                    contentMiddle: [
                        new Title({
                            text: "Message",
                            level: TitleLevel.H1
                        })
                    ]
                }),
                contentHeight: "50%",
                contentWidth: "50%",
                verticalScrolling: false
            }) */
        },
        onInitSmartFilterBarExtension: function(oSource){

            // Thiết lập giá trị mặc định
            
            // Cập nhật giá trị mặc định trở lại cho filter bar
            var oSmartFilterBar = oSource.getSource();
            let oDefaultFilter = {
                "$Parameter.P_CompanyCode" : '1000',
                "$Parameter.P_DeprArea" : '01',
                "PostingDate": {
                    "conditionTypeInfo": {
                        "name": "sap.ui.comp.config.condition.DateRangeType",
                        "data": {
                            "operation": "THISYEAR",
                            "value1": null,
                            "value2": null,
                            "key": "PostingDate",
                            "calendarType": "Gregorian"
                        }
                    }
                }
            }
            oSmartFilterBar.setFilterData(oDefaultFilter);
        },
        actionExportExcel: function(oSource){
/*                 "Actions": {
                  "actionExportExcel": {
                    "id": "actionExportExcel",
                    "text": "Export báo cáo",
                    "press": "actionExportExcel"
                  }
                } */
             console.log(this.getView().byId('listReportFilter').getFilterData())

            let thatController = this
            let oModel = this.getView().getModel()
            let filters = this.getView().byId('listReportFilter').getFilters()
            let parameters = this.getView().byId('listReportFilter').getFilterData()
            this.selectedYear = parameters['$Parameter.P_FiscalYear']
            let paramsUrl = this.getView().byId('listReportFilter').getParameterBindingPath()

            this.getFieldCatalog()
            
            oModel.read(`${paramsUrl}/$count`, {
                //  filters: filters,
                success: function (number) {
                    oModel.read(`${paramsUrl}`, {
                        filters: filters,
                        urlParameters: {
                            '$top': number
                        },
                        success: function (data) {
                            thatController.getFieldCatalog()
                            thatController.fillDataExcel(data.results)
                            thatController.exportExcel()
                        }
                    })
                }
            }) 
        },
        onBeforeRebindTableExtension: function (oEvent) {
            let listMonth = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            this.selMonth = []
            let selPostingDate = this.byId('zfbcttgtscd::sap.suite.ui.generic.template.ListReport.view.ListReport::ZFI_I_BCTHTGTSCDSet--listReportFilter')
            let fromMonth = selPostingDate.getFilterData()['PostingDate']['ranges'][0].value1.getMonth() + 1
            let toMonth = selPostingDate.getFilterData()['PostingDate']['ranges'][0].value2.getMonth() + 1
            for (let month = fromMonth; month <= toMonth; month++) {
                this.selMonth.push(month)
            }
            let excludeMonth = listMonth.filter(x => !this.selMonth.includes(x));
            let excludeColumn = []
            excludeMonth.forEach((month)=>{
                excludeColumn.push(`Depr${('00'+month).slice(-3)}`)
            })
            oEvent.getSource().deactivateColumns(excludeColumn);
        },
        convertExcelColCharacter: function(index){
            var result = '';
            do {
                result = (index % 26 + 10).toString(36) + result;
                index = Math.floor(index / 26) - 1;
            } while (index >= 0)
            return result.toUpperCase();
        },   
        appendLine : function(value, rowIndex){
            let row = []
            const VND = new Intl.NumberFormat('en-DE');
            this.fieldCatalog.forEach((col, index)=>{
                if (col.type == 'currency') {
                    value[col.colField] = VND.format(value[col.colField] ? value[col.colField] : 0)
                    this.excelStyle.push({
                        cell : `${this.convertExcelColCharacter(index)}${rowIndex}`,
                        style: {
                            font: {
                                name: "Times New Roman"
                            },
                            alignment: {
                                horizontal: "right"
                            },
                            border: {
                                top: { style: "thin", color: {rgb:"000000"}},
                                bottom: { style: "thin", color: {rgb:"000000"}},
                                left: { style: "thin", color: {rgb:"000000"}},
                                right: { style: "thin", color: {rgb:"000000"}}
                            }
                        }
                    })
                } else {
                    this.excelStyle.push({
                        cell : `${this.convertExcelColCharacter(index)}${rowIndex}`,
                        style: {
                            font: {
                                name: "Times New Roman"
                            },
                            border: {
                                top: { style: "thin", color: {rgb:"000000"}},
                                bottom: { style: "thin", color: {rgb:"000000"}},
                                left: { style: "thin", color: {rgb:"000000"}},
                                right: { style: "thin", color: {rgb:"000000"}}
                            }
                        }
                    })
                }
                row.push(value[col.colField] ? value[col.colField] : '')
            })
            return row
        },
        fillDataExcel: function(listAssets){
            this.exportData = []
            thatController = this
            let prevAssetClass = {
                AssetClass : '',
                AssetClassName : ''
            }
            let sumAssetClass = {
                NguyenGia : 0.0,
                OrdDepr : 0.0,
                BeginAccDepr : 0.0,
                BeginConLai : 0.0,
                FixedAssetDescription : '',
                Depr001 : 0.0,
                Depr002 : 0.0,
                Depr003 : 0.0,
                Depr004 : 0.0,
                Depr005 : 0.0,
                Depr006 : 0.0,
                Depr007 : 0.0,
                Depr008 : 0.0,
                Depr009 : 0.0,
                Depr010 : 0.0,
                Depr011 : 0.0,
                Depr012 : 0.0
            }
            let row = []
            let rowIndex = 1
            this.fieldCatalog.forEach((col, index)=>{
                row.push(col.name)
                this.excelStyle.push({
                    cell : `${this.convertExcelColCharacter(index)}${rowIndex}`,
                    style:  {
                        font: {
                            bold: true,
                            name: "Times New Roman"
                        },
                        alignment: {
                            horizontal: "center"
                        },
                        border: {
                            top: { style: "thin", color: {rgb:"000000"}},
                            bottom: { style: "thin", color: {rgb:"000000"}},
                            left: { style: "thin", color: {rgb:"000000"}},
                            right: { style: "thin", color: {rgb:"000000"}}
                        }
                    }
                })
            })
            this.exportData.push(row)
            rowIndex += 1
            let itemAssetClass = []
            
            listAssets.forEach((asset, index) => {
                row = []
                rowIndex += 1
                if (index == 0 ){
                    prevAssetClass = {
                        AssetClass : asset.AssetClass,
                        AssetClassName : asset.AssetClassName
                    }
                } else if (asset.AssetClass !== prevAssetClass.AssetClass){
                    
                    sumAssetClass.FixedAssetDescription = prevAssetClass.AssetClassName
                    row = this.appendLine(sumAssetClass, rowIndex)
                    this.exportData.push(row)
                    this.exportData = [...this.exportData, ...itemAssetClass]
                    sumAssetClass = {
                        NguyenGia : 0.0,
                        OrdDepr : 0.0,
                        BeginAccDepr : 0.0,
                        BeginConLai : 0.0,
                        FixedAssetDescription : '',
                        Depr001 : 0.0,
                        Depr002 : 0.0,
                        Depr003 : 0.0,
                        Depr004 : 0.0,
                        Depr005 : 0.0,
                        Depr006 : 0.0,
                        Depr007 : 0.0,
                        Depr008 : 0.0,
                        Depr009 : 0.0,
                        Depr010 : 0.0,
                        Depr011 : 0.0,
                        Depr012 : 0.0
                    }
                    prevAssetClass = {
                        AssetClass : asset.AssetClass,
                        AssetClassName : asset.AssetClassName
                    }
                    itemAssetClass = []
                }
                row = this.appendLine(asset, rowIndex)
                itemAssetClass.push(row)
                
                sumAssetClass.NguyenGia += parseInt(asset.NguyenGia) 
                sumAssetClass.OrdDepr += parseInt(asset.OrdDepr) 
                sumAssetClass.BeginAccDepr += parseInt(asset.BeginAccDepr) 
                sumAssetClass.BeginConLai += parseInt(asset.BeginConLai) 
                sumAssetClass.Depr001 += parseInt(asset.Depr001)
                sumAssetClass.Depr002 += parseInt(asset.Depr002)
                sumAssetClass.Depr003 += parseInt(asset.Depr003) 
                sumAssetClass.Depr004 += parseInt(asset.Depr004) 
                sumAssetClass.Depr005 += parseInt(asset.Depr005) 
                sumAssetClass.Depr006 += parseInt(asset.Depr006) 
                sumAssetClass.Depr007 += parseInt(asset.Depr007)
                sumAssetClass.Depr008 += parseInt(asset.Depr008) 
                sumAssetClass.Depr009 += parseInt(asset.Depr009) 
                sumAssetClass.Depr010 += parseInt(asset.Depr010) 
                sumAssetClass.Depr011 += parseInt(asset.Depr011) 
                sumAssetClass.Depr012 += parseInt(asset.Depr012)
            })
        },
        getFieldCatalog: function(){
            this.fieldCatalog = [
                {name: 'STT',                  colField: 'stt'},
                {name: 'NGÀY CT',              colField: 'CapitalizedOn'},
                {name: 'SỐ THẺ TS',            colField: 'MasterFixedAsset'},
                {name: 'TÊN TÀI SẢN',          colField: 'FixedAssetDescription'},
                {name: 'NGÀY MUA',             colField: 'CapitalizedOn'},
                {name: 'TK TÀI SẢN',           colField: 'AssetAccount'},
                {name: 'TK KHẤU HAO',          colField: 'DeprAccount'},
                {name: 'TK CHI PHÍ',           colField: 'CostAccount'},
                {name: 'SỐ KỲ KH',             colField: 'SoKyKhauHao'},
                {name: 'NGUYÊN GIÁ',           colField: 'NguyenGia', type:'currency' },
                {name: 'GTRỊ 1 KỲ',            colField: 'OrdDepr', type:'currency'},
                {name: 'KH LUỸ KẾ ĐẦU KỲ',     colField: 'BeginAccDepr', type:'currency'},
                {name: 'GTRỊ CÒN LẠI ĐẦU KỲ',  colField: 'BeginConLai', type:'currency'},
                {name: 'Tháng 1',  colField: 'Depr001', type:'currency'},
                {name: 'Tháng 2',  colField: 'Depr002', type:'currency'},
                {name: 'Tháng 3',  colField: 'Depr003', type:'currency'},
                {name: 'Tháng 4',  colField: 'Depr004', type:'currency'},
                {name: 'Tháng 5',  colField: 'Depr005', type:'currency'},
                {name: 'Tháng 6',  colField: 'Depr006', type:'currency'},
                {name: 'Tháng 7',  colField: 'Depr007', type:'currency'},
                {name: 'Tháng 8',  colField: 'Depr008', type:'currency'},
                {name: 'Tháng 9',  colField: 'Depr009', type:'currency'},
                {name: 'Tháng 10',  colField: 'Depr010', type:'currency'},
                {name: 'Tháng 11',  colField: 'Depr011', type:'currency'},
                {name: 'Tháng 12',  colField: 'Depr012', type:'currency'},
                { name: "TỔNG KH TRONG KỲ",     colField : "TotalDeprInPer", type:'currency'} ,
                { name: "KHẤU HAO CUỐI KỲ",     colField : "EndAccDepr",     type:'currency'},
                { name: "GTRỊ CÒN LẠI CUỐI KỲ", colField : "EndConLai",  type:'currency'}
            ]
        },
        exportExcel: function(oSource){
            var xlsxData = XLSX.utils.aoa_to_sheet(this.exportData)
            const spreadsheet = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(spreadsheet, xlsxData, 'Data')
            this.excelStyle.forEach(value=>{
                spreadsheet.Sheets["Data"][value.cell].s = value.style
            })
            XLSX.writeFile(spreadsheet, "Báo cáo tình hình tài sản cố định.xlsx");
        }
    }
}
)