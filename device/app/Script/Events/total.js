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
	if ($.HungryImageTrue.Visible || $.AngryImageTrue.Visible) {

		if (!IsNullOrEmpty($.RemindComment.Text)){
			var reminder = DB.Create("Document.Reminder");
			reminder.Reminders = event;

			if ($.HungryImageTrue.Visible && !$.AngryImageTrue.Visible){
				reminder.ViewReminder = DB.Current.Constant.VidRemember.Sale;
			}

			if (!$.HungryImageTrue.Visible && $.AngryImageTrue.Visible){
				reminder.ViewReminder = DB.Current.Constant.VidRemember.Problem;
			}

			reminder.Date = DateTime.Now;

			reminder.Comment = $.RemindComment.Text;

			reminder.Save(false);

			Dialog.Message("Оповещение будет отправлено при следующей синхронизации!");
			$.AngryImageTrue.Visible = false;
			$.AngryImageFalse.Visible = true;
			$.HungryImageTrue.Visible = false;
			$.HungryImageFalse.Visible = true;
			$.RemindComment.Text = "";
		} else {
			Dialog.Message("Оставьте комментарий");
		}
	} else {
		Dialog.Message("Укажите один из статусов оповещения");
	}
}

function askCommit(sender, event){
	q = new Query("SELECT DEE.Id FROM Document_Event_Equipments DEE WHERE DEE.Result = @newStatus AND DEE.Ref = @Ref");
	q.AddParameter("newStatus", DB.Current.Constant.ResultEvent.New);
	q.AddParameter("Ref", event);
	cnt = q.ExecuteCount();
	if(cnt == 0){
		Dialog.Ask("После завершения визита его нельзя будет отредактировать. Вы хотите завершить визит?", CommitEvent, event);
	} else {
		Dialog.Message("Для завершения визита необходимо завершить все задачи.");
	}
}


function CommitEvent(state, args){
	if (StrLen($.ExecutiveComment.Text) > 500) {
		Dialog.Message(Translate["#ToLongText500#"] +  StrLen($.ExecutiveComment.Text));
		return;
	}

	obj = state.GetObject();
	obj.Status = DB.Current.Constant.StatusyEvents.Done;
	obj.CommentContractor = $.ExecutiveComment.Text;
	obj.ActualEndDate = DateTime.Now;
	obj.Save();
	Workflow.Commit();
}

function SetExecutiveComment(sender, ref) {
	if (StrLen($.ExecutiveComment.Text) <= 500){
		obj = ref.GetObject();
		obj.CommentContractor = $.ExecutiveComment.Text;
		obj.Save();
	} else {
		Dialog.Message(Translate["#ToLongText500#"] + StrLen($.ExecutiveComment.Text));
	}

}
