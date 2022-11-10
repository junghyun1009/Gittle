const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { CLICK } = require("./constants");

let child_process = require("child_process");
const { check } = require("yargs");

let runCommand = (command) => {
  return child_process.execSync(command).toString();
};

let currentRepo;
let gitDir;
function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, "../public/apple.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },

  });
  win.webContents
    .executeJavaScript('localStorage.getItem("currentRepo");', true)
    .then(result => {
      currentRepo = result
      gitDir = `--git-dir=${currentRepo}\\.git`
      console.log(currentRepo)
    });

  win.loadURL("http://localhost:3000");
  // currentRepo = localStorage.getItem("currentRepo");
  // console.log(currentRepo)
}

ipcMain.on(CLICK, (event, arg) => {
  dialog
    .showOpenDialog({ properties: ["openDirectory"] })
    .then((result) => {
      console.log(result.filePaths[0]);

      event.returnValue = result.filePaths[0];
    })
    .catch((err) => {
      console.log("에러발생", err);
    });
});

ipcMain.on("update-my-repo", (event, arg) => {
  console.log("변화시작");
  const Store = require("electron-store");
  const store = new Store();

  let arr = store.get("gittle-myRepo");
  store.delete('gittle-myRepo')

  if (arr === undefined) {
    arr = [];
  }

  arr.unshift(arg);

  if (arr.length === 4) {
    arr.pop();
  }

  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
  store.set("gittle-myRepo", arr);
});

ipcMain.on("call-my-repo", (event, arg) => {
  console.log("가져오기 시작");
  const Store = require("electron-store");
  const store = new Store();

  // let arr = store.get("gittle-myRepo");
  let arr = localStorage.getItem("currentRepo")


  if (arr === undefined) {
    arr = [];
  }

  console.log("arr : " + arr);

  let result = [];

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== null) {
      result.push(arr[i]);
    }

    console.log(arr[i]);
  }

  if (result.length !== arr.length) {
    // store.set("gittle-myRepo", result);
    localStorage.setItem(result)
  }

  console.log(result.length);
  console.log(result);
  console.log("돌아갑니다");
  event.returnValue = result;
});

ipcMain.on("branchList", (event, route) => {
  console.log("브랜치 리스트");

  const codes = [];
  let branchList = runCommand(`git --git-dir=${route}\\.git branch -a`);
  console.log("branchList : ", branchList);
  codes.push(branchList);
  event.returnValue = codes;
});

ipcMain.on("change branch", (event, route, selectedBranch) => {
  console.log("브랜치 이동");
  console.log("selectedBranch : ",selectedBranch)

  const codes = [];
  let branch = runCommand(
    `cd "${route}" && git init && git checkout ${selectedBranch}`
    // `git --git-dir=${route}\\.git checkout ${selectedBranch}`
  );
  console.log("change branch : ", branch);
  codes.push(branch);
  event.returnValue = codes;
});

// ipcMain.on("gitBranch", (event, newBranch, baseBranch) => {
ipcMain.on("add branch", (event, route, newBranch) => {
  console.log("브랜치 추가");

  const codes = [];
  // let branch = runCommand(`git checkout -b ${newBranch} ${baseBranch}`);
  let branch = runCommand(
    `git --git-dir=${route}\\.git checkout -b ${newBranch}`
  );
  console.log("add branch : ", branch);
  codes.push(branch);
  event.returnValue = codes;
});

ipcMain.on("delete branch", (event, route, delBranch) => {
  console.log("브랜치 삭제");

  const codes = [];
  let branch = runCommand(
    `git --git-dir=${route}\\.git branch -d ${delBranch}`
  );
  console.log("delete branch : ", branch);
  codes.push(branch);
  event.returnValue = codes;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("gitStatus", (event, currentRepo) => {
  let data = runCommand(`git --git-dir=${currentRepo}\\.git --work-tree=${currentRepo} status -u -s`);
  event.returnValue = data;
});

ipcMain.on("WriteCommitConvention", (event, payload) => {
  // if (!fs.existsSync(`${currentRepo}/commitConvention.json`)) {
  //   console.log("does not exist")
  //   fs.appendFileSync(
  //     `${currentRepo}/commitConvention.json`,
  //     "[" + JSON.stringify(payload) + "]"
  //   );
  //   const commitRules = JSON.parse(
  //     fs.readFileSync(`${currentRepo}/commitConvention.json`).toString()
  //   );
  //   event.returnValue = commitRules;
  // } 
  const commitRules = JSON.parse(
    fs.readFileSync(`${currentRepo}/commitConvention.json`).toString()
  );
  commitRules.push(payload);
  fs.writeFileSync(
    `${currentRepo}/commitConvention.json`,
    JSON.stringify(commitRules)
  );
  event.returnValue = commitRules;
});

ipcMain.on("ReadCommitConvention", (event) => {
  if (!fs.existsSync(`${currentRepo}/commitConvention.json`)) {
    fs.appendFileSync(`${currentRepo}/commitConvention.json`, "[]");
  }
  const commitRules = fs.readFileSync(`${currentRepo}/commitConvention.json`).toString();
  event.returnValue = commitRules;
});

ipcMain.on("git-Clone", (event, payload) => {
  console.log("도착했습니다");
  console.log("저장소 루트 : " + payload.cloneRoot);
  console.log("폴더 루트 : " + payload.repoRoot);
  let stringArr=payload.cloneRoot.split("/")
  for(let i=0;i<stringArr.length;i++){
    console.log(i,"번째 : ",stringArr[i])
  }

  let temp=stringArr[stringArr.length-1]
  let folderName=temp.substr(0,temp.length-4)
  console.log("folderName : ",folderName)
  runCommand(
    `cd "${payload.repoRoot}" && git clone ${payload.cloneRoot}`
  );

  console.log('돌아갑니다')
  event.returnValue=folderName

});

ipcMain.on("git-Init", (event, payload) => {
  console.log('repoName : '+payload.repoName)
  console.log('repoRoot : '+payload.repoRoot)
  runCommand(`cd "${payload.repoRoot}" && mkdir ${payload.repoName}  && cd ${payload.repoName}  && git init`);
  event.returnValue=payload.repoName+"\\"+payload.repoRoot
});

ipcMain.on("gitDiff", (event, arg) => {
  console.log("코드 전후 비교해볼래");
  console.log(arg);
  const codes = [];
  arg.map((file) => {
    // const name = file.split("/");
    // const fileName = name[name.length - 1];
    let diff = runCommand(`git diff ${file}`);
    console.log("git diff : ", diff);
    codes.push(diff);
  });
  event.returnValue = codes;
  // const Store=require('electron-store')
  // const store = new Store()

  // let arr = store.get('gittle-myRepo')

  // if(arr===undefined){
  //   arr=[]
  // }
  // console.log(arr)
  // console.log('돌아갑니다')
  // event.sender.send('return-2',arr)
});
ipcMain.on("gitAdd", (event, files) => {
  let data = runCommand(`git add ${gitDir} -v ${files}`);
  console.log(data);
});

ipcMain.on("gitReset", (event, files) => {
  let data = runCommand(files);
  console.log(data);
})

ipcMain.on('git-Branch',(event,payload)=>{
  let data= runCommand(`cd "${payload}" && git branch -r`)
  // console.log(typeof(data))
  // console.log("data : "+data)
  let result=data.split('\n')
  let arr=[]
  for(let i=0;i<result.length;i++){
    if(result[i].length!==0){
      let tempArr=result[i].split('/')
      let temp=""
      for(let j=1;j<tempArr.length;j++){
        temp+=tempArr[j]
        if(j!==tempArr.length-1){
          temp+="/"
        }
      }

      arr.push(temp)
    }
  }

  event.returnValue=arr
})

ipcMain.on("gitBranch", (event, route) => {
  console.log("현재 작업 중인 브랜치를 보여줘");
  console.log(route);
  const branch = runCommand(
    `git --git-dir=${route}\\.git branch --show-current `
  );
  console.log("브랜치이이이", branch);
  event.returnValue = branch;
});

ipcMain.on("gitCommit", (event, payload) => {
  let data = runCommand(payload);
  console.log(data);
  event.returnValue = data;
});

ipcMain.on("lastCommitDescription", (event, payload) => {
  let data;
  try {
    data = runCommand(payload)
    data = data.substring(1, data.length-1)
    data = data.includes(" : ") ? data.split(" : ")[1] : data
  } catch (error) {
    console.error(error);
    data = "";
  }
  event.returnValue = data;
});

ipcMain.on("openTerminal", (event) =>{
  child_process.exec(`cd ${currentRepo} && start "" "%PROGRAMFILES%\\Git\\bin\\sh.exe" --login`)
});
