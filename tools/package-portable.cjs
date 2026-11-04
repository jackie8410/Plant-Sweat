// Fallback for Windows hosts where Node fs.cpSync fails on directory copies.
// Package only tracked files from HEAD; never include working-tree changes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),archive=path.resolve(process.argv[2]||path.join(root,'../zhong-maoyi-site.tar.gz'));
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
if(git(['status','--porcelain']))throw Error('Commit and synchronize all source changes before packaging');
if(archive.startsWith(root+path.sep))throw Error('Archive must be outside the source tree');
const sha=git(['rev-parse','HEAD']),stage=fs.mkdtempSync(path.join(path.dirname(root),'.package-zmy-'));
const source=path.join(stage,'source.tar');git(['archive','--format=tar','--output='+source,'HEAD','dist','.openai/hosting.json']);
cp.execFileSync('tar.exe',['-xf',source,'-C',stage],{windowsHide:true});
const sourceManifest=JSON.parse(fs.readFileSync(path.join(stage,'.openai/hosting.json'),'utf8'));
if(sourceManifest.static?.directory!=='dist')throw Error('This fallback only packages buildless dist Sites');
fs.mkdirSync(path.join(stage,'dist/.openai'),{recursive:true});
fs.writeFileSync(path.join(stage,'dist/.openai/hosting.json'),JSON.stringify(sourceManifest));
cp.execFileSync('tar.exe',['-czf',archive,'-C',stage,'dist'],{windowsHide:true});
const entries=cp.execFileSync('tar.exe',['-tzf',archive],{encoding:'utf8',windowsHide:true});
if(!entries.includes('dist/.openai/hosting.json')||!entries.includes('dist/index.html'))throw Error('Invalid archive');
console.log(JSON.stringify({project_id:sourceManifest.project_id,commit_sha:sha,archive}));
