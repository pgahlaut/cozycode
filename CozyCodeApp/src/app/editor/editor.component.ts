import { Component, AfterViewInit, ElementRef, ViewChild,EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import * as ace from "ace-builds";

const SESSION_URL = 'http://52.15.105.108:80/getsession';

@Component({
  selector: 'code-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements AfterViewInit {

   POST_URL = "http://52.15.105.108:80/runner/submit";
  sessionID:string;
  aceEditor;
  language:string;
  cmd_input:string = 'undefined';
  constructor(private http: HttpClient) { }
  

  @ViewChild("editor") private editor: ElementRef<HTMLElement>;
  @Output() outputEvent = new EventEmitter<String>();
  @Output() inputEvent = new EventEmitter();
  @Output() ioThemeEvent = new EventEmitter<String>();
  ngAfterViewInit(): void {
    ace.config.set("fontSize", "16px");

    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
    ace.require("ace/ext/language_tools");
    

    this.aceEditor = ace.edit(this.editor.nativeElement);
    this.aceEditor.session.setValue("//Your code goes here...");
    this.aceEditor.setShowPrintMargin(false);
    this.aceEditor.setTheme('ace/theme/dracula');
    this.aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: false
    });
    this.getSessionID();
  }
  getSessionID(){
    this.http.get<any>(SESSION_URL).subscribe(data=>{
      this.sessionID = data.sessionID;
    });
    
  }
  setLanguageMode($event){
    let s:string;
    if($event=='c'){
      $event='c_cpp';
      this.language='c';
    }
    else if($event=='cpp'){
      this.language='cpp';
      $event='c_cpp';
    }
    else if($event=='c#')
      $event='csharp';
    s = 'ace/mode/'+$event;
    this.aceEditor.session.setMode(s);
    this.aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });
  }

  clearEditor($event){
    this.aceEditor.setValue("");
  }
  setTheme($event){
    var s:string = $event;
    s=s.toLowerCase();
    this.aceEditor.setTheme('ace/theme/'+s);
    this.ioThemeEvent.emit(s);
  }

  sendData($event){
    this.inputEvent.emit();
    let data = {
      src: this.aceEditor.getValue(),
      lang: this.aceEditor.session.$modeId,
      cmd_input: this.cmd_input,
      sessionID: this.sessionID,
      language: this.language
    }
    let httpOptions:{headers,observe} = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
        }),
        observe: 'response' 
    };
     this.http.post(this.POST_URL,data,httpOptions).subscribe((res:any)=>{
       if(res.body.status == "success")
        this.outputEvent.emit(res.body.output+res.body.error);
        else if(res.body.status == "error"){
          console.log("Failed to run code on server end!");
          this.outputEvent.emit("Failed to run code on server end!");
        }
        
     });
  
  }
}
