function ChangeListAndRefresh(control) {
    $.Remove("WorM");
    $.AddGlobal("WorM", control);
    Workflow.Refresh([$.param1]);
}

function actionDoSelect(){
  Vars.setNextAdd(true);
  Workflow.Action("CreateOrderMat",[Vars.getEvent()]);
}

function DoNextStep(param){

		if ($.MobileSettings.UsedEquipment){
			DoAction("tasks", param);
			return;
		}

		if ($.MobileSettings.UsedCheckLists){
			var q = new Query("SELECT DEC.Id " +
		                "FROM Document_Event_CheckList DEC " +
		                "WHERE DEC.Ref = @event")
			q.AddParameter("event", param);
			if (q.ExecuteCount() > 0) {
				DoAction("checklist", param);
			} else {
				DoAction("Total", param);	}
			return;
		}

		DoAction("Total", param);
}

function editCountSKU(sender, id, isInPlan) {
  if (isInPlan == 1){
      if ($.WorM == 'work'){
        if ($.MobileSettings.EditPlanService){
          var obj = id.GetObject();
          Workflow.Action('AddSKU', [obj, 1]);
        }
      } else {
        if ($.MobileSettings.EditPlanMaterials){
          var obj = id.GetObject();
          Workflow.Action('AddSKU', [obj, 1]);
        }
      }
  } else {
    var obj = id.GetObject();
    Workflow.Action('AddSKU', [obj, 1]);
  }

}

function getRIM(servises) {
  var q = new Query("SELECT DERIM.Id AS Id, " +
                    "DERIM.LineNumber AS Line, " +
                    "CRIM.Description AS Description, " +
	                  "CRIM.Service AS isService, " +
	                  "DERIM.Price AS Price, " +
	                  "CASE WHEN DERIM.AmountFact > 0 THEN DERIM.AmountFact ELSE DERIM.AmountPlan END AS Amount, " +
                    "CASE WHEN DERIM.SumFact > 0 THEN DERIM.SumFact ELSE DERIM.SumPlan END AS Summ, " +
                    "CASE WHEN AmountPlan > 0 THEN 1 ELSE 0 END AS Ord " +
                    "FROM Document_Event_ServicesMaterials DERIM " +
                    "LEFT JOIN Catalog_RIM CRIM " +
                    "ON DERIM.SKU = CRIM.Id " +
                    "WHERE DERIM.Ref = @event " +
                    "AND isService = @isService " +
                    "ORDER BY Ord DESC, Line");
  q.AddParameter("isService", servises);
  q.AddParameter("event", Vars.getEvent());
  return q.Execute();
}

function deleteSKU(sender,id) {
  DB.Delete(id);
  Workflow.Refresh([]);
}

function SumPresent(price, count) {

  if (count > 1) {
    return count + " x " + price + " P";
  } else {
    return price  + " P";
  }
}

function isNullsetZero(val) {
	if (IsNullOrEmpty(val)){
		return 0;
	} else {
		return val;
	}
}


function getTotals() {
  var q = new Query("SELECT serTotal + matTotal AS TotalSumm, serTotal,  matTotal " +
                          "FROM (SELECT CASE WHEN @ucs = 1 " +
                                        "THEN SUM(CASE WHEN RIM.Service = 1 " +
                                                  "THEN CASE WHEN DES.SumFact > 0 " +
                                                            "THEN DES.SumFact " +
                                                            "ELSE DES.SumPlan END " +
                                                  "ELSE 0 END) " +
                                        "ELSE 0 END AS serTotal, "  +
                                  "CASE WHEN @ucm = 1 " +
                                        "THEN SUM(CASE WHEN RIM.Service = 0 " +
                                                  "THEN CASE WHEN DES.SumFact > 0 " +
                                                        "THEN DES.SumFact " +
                                                        "ELSE DES.SumPlan END " +
                                                  "ELSE 0 END) " +
                                        "ELSE 0 END AS matTotal " +
                          "FROM Document_Event_ServicesMaterials DES " +
                          "LEFT JOIN Catalog_RIM RIM " +
                          "ON DES.SKU = RIM.Id " +
                          "WHERE DES.Ref = @event)");
  q.AddParameter("event", Vars.getEvent());
  q.AddParameter("ucs", $.MobileSettings.UsedCalculateService);
  q.AddParameter("ucm", $.MobileSettings.UsedCalculateMaterials);
  var res = q.Execute();
  res.Next()
  return res;
}
