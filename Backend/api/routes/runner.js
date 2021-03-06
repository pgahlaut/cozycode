import express from 'express';
import fs from 'fs';
import util from 'util';
import child_process, { execSync } from 'child_process';


const router = express.Router();
const exec = util.promisify(child_process.exec);
const config = {
    headers: {
        'Content-Type': 'application/json'
    }
};

router.post('/submit',(req,res)=>{
    //Spin up a docker container
    //var ot = buildImage(req.body.sessionid);
    let src = req.body.src;
    var lang = req.body.lang;
    var extension;
    var sessionID = req.body.sessionID;
    var cmd_input = req.body.cmd_input;
    var language = req.body.language;
    createTempDir(sessionID);
    if(lang == 'ace/mode/java')
        extension = '.java';
    else if(lang == 'ace/mode/python')
        extension = '.py';
    else if(lang == 'ace/mode/c_cpp' && language=='c')
        extension = '.c';
    else if(lang == 'ace/mode/c_cpp' && language=='cpp')
        extension = '.cpp';
    else if(lang == 'ace/mode/csharp')
        extension = '.cs';
    else if(lang == 'ace/mode/javascript')
        extension = '.js';
    else if(lang == 'ace/mode/ruby')
        extension='.rb';
    //Write Job
    if(cmd_input!='undefined'){
        try{
            fs.writeFileSync('/home/ubuntu/cozycode/Backend/api/sessions/'+sessionID+'/input.txt',cmd_input,{flag : 'w'});
        }catch(err){
            console.log(err);
        }
    }
    try{
        fs.writeFileSync('/home/ubuntu/cozycode/Backend/api/sessions/'+sessionID+'/src'+extension,src,{flag  : 'w'});
    }catch(err){
        console.log(err);
        cleanup(sessionID);
        res.send({
            status :"error"
        });
    }
    
    var containerid = runImage(sessionID);
    setTimeout(function(){killContainer(containerid);},10000);
    //console.log(containerid);
    var output;
    var error=" ";
    setTimeout(function(){
        try{
            output = fs.readFileSync('./sessions/'+sessionID+'/output.txt','utf-8',(err,data)=>{
                if(err){
                    console.log(err);
                }
            });
            error=fs.readFileSync('./sessions/'+sessionID+'/error.txt','utf-8',(err,data)=>{
                if(err){
                    console.log(err);
                }
            });
        }catch(err){
            console.log("Error in reading output files!\n"+err);
            cleanup(sessionID);
            res.send({
                status :"error"
            });
            return;
        }
        var data = {
            output: output,
            error:error,
            status: "success"
        };
        cleanup(sessionID);
        res.send(data);
    },2000);
    
});
function createTempDir(sessionID){
    var exists = fs.existsSync("/home/ubuntu/cozycode/Backend/api/sessions/"+sessionID);
    if(!exists){
        fs.mkdirSync('./sessions/'+sessionID);
    }
    //Else continue
}
 function cleanup(sessionID){
     //Windows implementation
     //execSync('del /f /s /q .\\sessions\\'+sessionID+' 1>nul');
     //execSync('rmdir /s /q .\\sessions\\'+sessionID);

     //Linux implementation
     execSync('rm -rf ./sessions/'+sessionID);
}

function runImage(sessionID) {
    
    const stdout=  execSync('docker run -d --mount src="/home/ubuntu/cozycode/Backend/api/sessions/'+sessionID+'",dst=/source,type=bind cimage' );
   
    return stdout;
}
function killContainer(containerid){
    console.log('fn called to kill '+containerid);
    exec('docker container inspect --format=\'{{.State.Running}}\' '+containerid,(err,out,stderr)=>{
        if(err){
            console.log(err);
        }else{
           // console.log(out);
            var s = out.trim();
            console.log(s);
            if(s=='\'true\''){
                console.log('Container still running. Trying to stop...');
                var stdout =  execSync('docker container kill '+containerid);
            }
                
        }
    });
    
}



export default router;