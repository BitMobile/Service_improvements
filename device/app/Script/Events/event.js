function DoBackAndClean(){
	Workflow.Back();
	//DB.Rollback();
}

function GetAndSetStartTime(event){
	//Dialog.Message(event);
	var obj = event.GetObject();
	//Dialog.Message(obj.ActualStartDate);
	if (obj.ActualStartDate == '01.01.0001 0:00:00') {
		obj.ActualStartDate = DateTime.Now;
		obj.Save();
	}
	//Dialog.Message(ActualStartDate);
}

function FixDateTimeAndCoord(){
	//$.StartVisit.Visible = false;
	$.dataSyncLayout.Visible = true;
	$.dataSyncIndicator.Start();
	var event = Vars.getEvent();
	eventInObj = event.GetObject();
		eventInObj.ActualStartDate = DateTime.Now;
		var location = GPS.CurrentLocation;
		if(ActualLocation(location)) {
				eventInObj.Latitude = location.Latitude;
				eventInObj.Longitude = location.Longitude;
				//eventInObj.Save(false);
				//$.Coordinats = location.Latitude + "; " + location.Longitude;
				//Workflow.Refresh([param1]);
		} else {
			//Dialog.Message("Не удалось получить координаты.");
		}
		eventInObj.Save(false);
		DB.Save();
		DB.Sync(SyncDataFinish);

//
}
function SyncDataFinish(state) {
	$.dataSyncIndicator.Stop();
		Workflow.Refresh([]);
				//$.ftpSyncIndicator.Stop();
	//Dialog.Message(state);
}
function CancelVisit(){
	var event = Vars.getEvent();
	var eventInObj = event.GetObject();
	var q = new Query("Select Id From Enum_StatusyEvents Where Name = 'Cancel'");
	eventInObj.Status = q.ExecuteScalar();//DB.Current.Constant.VisitStatus.Cancel;
	//Dialog.Message(eventInObj.Status);
	eventInObj.Save(false);
	Workflow.Commit();
}
function AddSnapshotEvent(sender) { // optional: title, path
	var listChoice = new List;
	if ($.MobileSettings.AllowGalery) {
		listChoice.Add([1, Translate["#makeSnapshot#"]]);
		listChoice.Add([0, Translate["#addFromGallery#"]]);
		Dialog.Choose(Translate["#snapshot#"], listChoice, AddSnapshotHandlerEvent);
	} else {
		MakeSnapshotEvent();
	}
}
function AddSnapshotHandlerEvent(state, args) {

	if (parseInt(args.Result)==parseInt(0)){ 	//Gallery answer
		ChooseFromGalleryEvent();
	}

	if (parseInt(args.Result)==parseInt(1)){ 	//SnapshotAnswer
		MakeSnapshotEvent();
	}

}
function MakeSnapshotEvent() {
	FileSystem.CreateDirectory(String.Format("/private/{0}", GetParentFolderName(Vars.getEvent())));

	var pictId = Global.GenerateGuid();
	var path = GetPrivateImagePath(Vars.getEvent(), pictId, ".jpg");
	Camera.Size = $.MobileSettings.PictureSize;

	Camera.Path = path;
	//Dialog.Message($.MobileSettings.PictureSize);
	Camera.MakeSnapshot(path, $.MobileSettings.PictureSize, SaveImage, [pictId]);
}

function SnapshotActionsEvent(sender, pictId) { // optional: title, path
		var listChoice = new List;
		listChoice.Add([0, Translate["#DeleteSnapShot#"]]);

		Dialog.Choose(Translate["#snapshot#"], listChoice, SnapshotActionsEventHandler, [pictId]);
}
function SnapshotActionsEventHandler(state, args){
		if (parseInt(args.Result)==parseInt(0)){
				DeleteSnapShotEvent(state[0]);
		}
}
function DeleteSnapShotEvent(pictId) {
	q = new Query("SELECT Id FROM Document_Event_Foto WHERE Ref == @ref AND FilePath == @pict");
	q.AddParameter("ref", Vars.getEvent());
	q.AddParameter("pict", pictId);
	res = q.ExecuteScalar();
	DB.Delete(res);

	if (FileSystem.Exists(GetPrivateImagePath(Vars.getEvent(), pictId, ".jpg"))){
	 	FileSystem.Delete(GetPrivateImagePath(Vars.getEvent(), pictId, ".jpg"));
	}

	Workflow.Refresh([]);
}

function SnapshotEventExists(pictId) {
		var q = new Query("Select FilePath From Document_Event_Foto WHERE Ref = @ref AND FilePath = @pict");
		q.AddParameter("ref", Vars.getEvent());
		q.AddParameter("pict", pictId);
		var filename = q.ExecuteScalar();
		var fileFound = !String.IsNullOrEmpty(filename);
		var fileExists = (fileFound ? FileSystem.Exists(GetPrivateImagePath(Vars.getEvent(), pictId, ".jpg")) : false);
		return fileFound && fileExists;
}

function GetPrivateImage(pictID) {
	var ref = Vars.getEvent();
	var objectType = GetParentFolderName(ref);
	var r = "/private/" + objectType + "/" + ref.Id.ToString() + "/"
    + pictID + ".jpg";
//		Dialog.Message(r);
	return r;
}
function SaveImage(state, args){
		if (args.Result){
			objSnapShot = DB.Create("Document.Event_Foto");
			objSnapShot.Ref = Vars.getEvent();
			objSnapShot.FilePath = state[0];
			objSnapShot.Save();
			Workflow.Refresh([]);
		}
}


function ChooseFromGalleryEvent() {
	FileSystem.CreateDirectory(String.Format("/private/{0}", GetParentFolderName(Vars.getEvent())));

	var pictId = Global.GenerateGuid();
	var path = GetPrivateImagePath(Vars.getEvent(), pictId, ".jpg");
	Gallery.Size = $.MobileSettings.PictureSize;

	Gallery.Copy(path, SaveImage, [pictId]);
}

function GetPrivateImagePath(objectID, pictID, pictExt) {
	var objectType = GetParentFolderName(objectID);
	var r = "/private/" + objectType + "/" + objectID.Id.ToString() + "/"
    + pictID + pictExt;
	return r;
}
function GetFoto(){
	var q1 = new Query("SELECT FilePath AS UIDPhoto From Document_Event_Foto WHERE Ref = @ref");
	q1.AddParameter("ref",Vars.getEvent());
	return q1.Execute();
}
function GetCount(){
	var q1 = new Query("SELECT FilePath AS UIDPhoto From Document_Event_Foto WHERE Ref = @ref");
	q1.AddParameter("ref",Vars.getEvent());
	if (q1.ExecuteCount() == 0) {
		return false;
	}else {
		return true;
	}
}

function DoActionAndSave(step, req, cust, outlet) {

}

function DoNextStep(param){
		GetAndSetStartTime(param);
		if ($.MobileSettings.UsedCalculate){
			DoAction("calculate", param);
			return;
		}

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

// # Begin Parameters

function GetEventParams(custRef) {
  var q = new Query("SELECT DEP.Id AS Id, CEO.EditingBMA AS Editing, CEO.Id AS ParamRef, CEO.Description AS Parameter, " +
	"DEP.Val AS Val, ETDP.Name AS Type, length(trim(DEP.Val)) AS VL " +
  "FROM Document_Event_Parameters DEP " +
  "LEFT JOIN Catalog_EventOptions CEO " +
  "ON DEP.Parameter = CEO.Id  " +
  "LEFT JOIN Enum_TypesDataParameters ETDP " +
  "ON CEO.DataTypeParameter = ETDP.ID " +
  "WHERE CEO.DisplayingBMA = 1 AND DEP.Ref = @custRef AND (VL > 0 OR Editing = 1) AND CEO.DeletionMark = 0 " +
	"ORDER BY DEP.LineNumber");

  q.AddParameter("custRef", custRef);
  return q.Execute();
}

// # End Parameters


function GetEventDetails() {
	return Vars.getEvent();
}

function PhoneExists(call) {
	if (IsNullOrEmpty(call)){
		return false;
	} else {
		return true;
	}
}



function MoreMakeContactCall(tel){
	Dialog.Question("#call# "+ tel + "?", PhoneCall, tel);
}

function PhoneCall(answ, tel){
	if (answ == DialogResult.Yes) {
		Phone.Call(tel);
	}
}

function setCoordinats(sender, outlet, param1){
	var location = GPS.CurrentLocation;
	if(ActualLocation(location)) {
	    var objOutlet = outlet.GetObject();
	    objOutlet.Latitude = location.Latitude;
	    objOutlet.Longitude = location.Longitude;
	    objOutlet.Save(false);
	    $.Coordinats = location.Latitude + "; " + location.Longitude;
	    Workflow.Refresh([param1]);
	} else {
		Dialog.Message("Не удалось получить координаты.");
	}
}

function updateCoordinats(outlet, param1) {
	Dialog.Choose("Координаты", [["update", Translate["#Refresh#"]],["copy", Translate["#Copy#"]], ["cut", Translate["#delete#"]]] , coordinatsCallBack, [outlet, param1]);
}

function coordinatsCallBack(state, args){
	var obj = state[0].GetObject();
	var location = GPS.CurrentLocation;

	if (args.Result == "update") {
		if(ActualLocation(location)) {
		obj.Latitude = location.Latitude;
		obj.Longitude = location.Longitude;
		obj.Save(false);
		Workflow.Refresh([state[1]]);
		} else {
			Dialog.Message("Не удалось получить координаты.");
		}
	}

	if (args.Result == "copy") {
		Clipboard.SetString(obj.Latitude + "; " + obj.Longitude);
	}

	if (args.Result == "cut") {
		obj.Latitude = 0;
		obj.Longitude = 0;
		obj.Save(false);
		Workflow.Refresh([state[1]]);
	}
}

function ShowClient(p){
	Vars.setClient(p);
	Workflow.Action("showClient",[]);
}


function isHungry(sender){

	if ($.HungryImageFalse.Visible == true){
		$.HungryImageFalse.Visible = false;
		$.HungryImageTrue.Visible = true;
		$.AngryImageTrue.Visible = false;
		$.AngryImageFalse.Visible = true;
	} else {
		$.HungryImageTrue.Visible = false;
		$.HungryImageFalse.Visible = true;
	}

	if ($.Exists("HungryTap")){
		$.Remove("HungryTap");
	} else {
		$.Add("HungryTap",true);
	}

}

function isAngry(sender){

	if ($.AngryImageFalse.Visible == true){
		$.AngryImageFalse.Visible = false;
		$.AngryImageTrue.Visible = true;
		$.HungryImageTrue.Visible = false;
		$.HungryImageFalse.Visible = true;
	} else {
		$.AngryImageTrue.Visible = false;
		$.AngryImageFalse.Visible = true;
	}

	if ($.Exists("AngryTap")){
		$.Remove("AngryTap");
	} else {
		$.Add("AngryTap",true);
	}

}

function checkCommentLength(sender){
	//var str = sender.Text;
	//sender.Text = Left(str, 250);
}

function createReminder(event){
	if (!IsNullOrEmpty($.RemindComment.Text)){
		if (StrLen($.RemindComment.Text) > 1000) {
			Dialog.Message(Translate["#ToLongText1000#"]  + " " +  StrLen($.RemindComment.Text));
			return;
		}
	}

	if ($.HungryImageTrue.Visible || $.AngryImageTrue.Visible) {

		if (!IsNullOrEmpty($.RemindComment.Text)){
			var reminder = DB.Create("Document.Reminder");
			reminder.Reminders = event;

			if ($.HungryImageTrue.Visible && !$.AngryImageTrue.Visible){
				reminder.ViewReminder = DB.Current.Constant.FoReminders.Sale;
			}

			if (!$.HungryImageTrue.Visible && $.AngryImageTrue.Visible){
				reminder.ViewReminder = DB.Current.Constant.FoReminders.Problem;
			}

			reminder.Date = DateTime.Now;

			reminder.Comment = $.RemindComment.Text;

			reminder.Save(false);

			Dialog.Message("#AfterSync#");
			$.AngryImageTrue.Visible = false;
			$.AngryImageFalse.Visible = true;
			$.HungryImageTrue.Visible = false;
			$.HungryImageFalse.Visible = true;
			$.RemindComment.Text = "";
		} else {
			Dialog.Message("#PostComment#");
		}
	} else {
		Dialog.Message("#SetStat#");
	}
}

function askCommit(sender, event){
	q = new Query("SELECT DEE.Id FROM Document_Event_Equipments DEE WHERE DEE.Result = @newStatus AND DEE.Ref = @Ref");
	q.AddParameter("newStatus", DB.Current.Constant.ResultEvent.New);
	q.AddParameter("Ref", event);
	cnt = q.ExecuteCount();
	if(cnt == 0 || !$.MobileSettings.UsedEquipment){
		Dialog.Ask(Translate["#ConfirmeEndReg#"], CommitEvent, event);
	} else {
		Dialog.Message(Translate["#CompliteAllTask#"]);
	}
}


function CommitEvent(state, args){
	if (StrLen($.ExecutiveComment.Text) > 1000) {
		Dialog.Message(Translate["#ToLongText1000#"] + " " +  StrLen($.ExecutiveComment.Text));
		return;
	}
	if ($.MobileSettings.UsedGpsFix){
		var location = GPS.CurrentLocation;
		if(ActualLocation(location)) {
			SaveEvent(state, location);
			Workflow.Commit();
		} else {
			Dialog.Choose(Translate["#noVisitCoordinats#"], [[1, Translate["#Commit#"]], [2, Translate["#TryAgain#"]], [0, Translate["#Abort#"]],], NoCoordinatVariats, state);
		}
	} else {
			SaveEvent(state, undefined);

			Workflow.Commit();
	}
}

function CommitEventNoCoordinats(state, args){
	if (StrLen($.ExecutiveComment.Text) > 1000) {
		Dialog.Message(Translate["#ToLongText1000#"] + " " +  StrLen($.ExecutiveComment.Text));
		return;
	}
	SaveEvent(state, undefined);
	Workflow.Commit();

}

function NoCoordinatVariats(state, args){
	if (args.Result == 1){
		CommitEventNoCoordinats(state, args);
	}

	if (args.Result == 2){
		CommitEvent(state, args);
	}


}

function SaveEvent(ref, loc){
	var obj = ref.GetObject();
	obj.Status = DB.Current.Constant.StatusyEvents.Done;
	obj.CommentContractor = $.ExecutiveComment.Text;
	obj.ActualEndDate = DateTime.Now;
	if (loc != undefined){
		obj.Latitude = location.Latitude;
		obj.Longitude = location.Longitude;
		obj.GPSTime = location.Time;
	}

	var q = new Query("SELECT Id, AmountPlan AS AP, SumPlan AS SP " +
										"FROM Document_Event_ServicesMaterials " +
										"WHERE AmountFact = 0 " +
										"AND Ref = @Ref");

	q.AddParameter("Ref", ref);
	var res = q.Execute();
	var itemObj = undefined;

	while (res.Next()){
		itemObj = res.Id.GetObject();
		itemObj.AmountFact = res.AP;
		itemObj.SumFact = res.SP;
		itemObj.Save();
	}

	obj.Save();

}

function SetExecutiveComment(sender, ref) {
	Console.WriteLine(ref);
		Console.WriteLine($.ExecutiveComment.Text);
	if (StrLen($.ExecutiveComment.Text) > 1000){
		Console.WriteLine("yes");
			Console.WriteLine(ref);
		Dialog.Message(Translate["#ToLongText1000#"] + " " + StrLen($.ExecutiveComment.Text));
	} else {
				Console.WriteLine("NO");
			Console.WriteLine(ref);
		obj = ref.GetObject();
			Console.WriteLine(obj.Ref);
				Console.WriteLine("obj");
		obj.CommentContractor = $.ExecutiveComment.Text;
		obj.Save();
	}
}

function DoBackAndCleanWithQuestion(){
	var event = Vars.getEvent();
	var q1 = new Query("SELECT FilePath AS UIDPhoto From Document_Event_Foto WHERE Ref = @ref");
	q1.AddParameter("ref", event);
	var PhotoCount = q1.ExecuteCount();

	 if (PhotoCount > 0){
	  	Dialog.Ask(Translate["#PhotosWillNotBeSaved#"], DoBackAndClean, event);
	 }
}
