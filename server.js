var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

  var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  const session=JSON.parse(fs.readFileSync('./public/session.json')) // 不能用 soString ,同时要注意操作和数据的一致性，你不能按照数组的API去操作字符串
  
   
//  小文档：先是判断是不是注册界面（用if），在判断是不是登录和首页（用else if），最后才是其他（else）

// -------------------------------------------------------------------------------------
    if(path==="/register"&&method==="POST"){ //if 是分支 if  else if   else 的第一个
      //设置头文件
    response.setHeader('Content-Type','text/html;charset=utf-8') ;
      // 拿到原本的JSON字符串
    const userArray=JSON.parse(fs.readFileSync("./datebase/users.json"))
     /******** 分割线，这下面四行是将登录界面传进来的二进制数据转化为字符串 ************/
    const array =[];
    request.on("data",(chunk)=>{array.push(chunk)});
    request.on("end",()=>{
    const string =Buffer.concat(array).toString()
     /******** 分割线，这上面四行是将传进来的二进制数据转化为字符串 ************/
    const obj =JSON.parse(string);
    const lastUser=userArray[userArray.length-1];
    //id为最后一个用户的id加1
    const newUser ={
      id:lastUser?lastUser.id+1:1,
      name:obj.name,
      password:obj.password,
    };
    userArray.push(newUser);
    fs.writeFileSync("./datebase/users.json",JSON.stringify(userArray));
    response.end();
  });}

  else if(path==="/home.html"){
    const cookie =request.headers['cookie']
    let sessionID=''
    try{
      sessionID=cookie.split(';').filter(s=>s.indexOf('session_id')>=0)[0].split('=')[1]
      
      //这里刚才出来一个bug，那就是没有正确的跳转
      //我先是从上到下的用console.log调试，发现是userId出来问题
      //然后安装找bug大法，大小写、拼写、括号
      // 发现有两个bug，userID少写了一个r，写成了useId，然后indexof（）的括号范围错了
    }catch(error){ }
    console.log(sessionID)
    if(sessionID){
      const userId=session[sessionID].user_id //刚才用console.log大法 发现bug出现在这里，说session[sessionID] 是undefined，那我就去看了开头的session，发现session是字符串
      // 注意！ 字符串是不能用 session[sessionID]这样的，这就说明了const session=JSON.parse(fs.readFileSync('./public/session.json')).toString是错误的，要去掉.toString
      console.log(userId)
      const userArray=JSON.parse(fs.readFileSync("./datebase/users.json"))
      const user=userArray.find(user=>user.id===userId)
      if(user){
        const string=fs.readFileSync('./public/home.html').toString()
        response.statusCode=200
        response.write(string.replace('未登录',`尊敬的用户${user.name},您已登录`))   
        response.end()
      }else{
        response.statusCode=200
        response.write(fs.readFileSync('./public/home.html'))
        response.end()
      }
    }else{
      response.statusCode=200
      response.write(fs.readFileSync('./public/home.html'))
      response.end()
    }
  }
 
  
  else if(path==="/sign_in"&&method==="POST"){
    response.setHeader("Content-Type","text/html;charset=utf-8");
    const userArray=JSON.parse(fs.readFileSync('./datebase/users.json'))
    const array=[]
    request.on("data",chunk=>{array.push(chunk)})
    request.on("end",()=>{
      const string=Buffer.concat(array).toString()
      const obj=JSON.parse(string)
      //user是一个形参，找到了就是第一个元素，没找到就是undifined
      const user=userArray.find((user)=>user.name===obj.name&&user.password===obj.password)
      if(user===undefined){
        response.statusCode=404;
        response.setHeader("Content-Type","text/json;charset=utf-8");
       } //`{"errorCode":1123}`
      else{
        response.statusCode=200;
        const random=Math.random()
        const session=JSON.parse(fs.readFileSync('./public/session.json').toString())
        session[random]={user_id:user.id}
        fs.writeFileSync('./public/session.json',JSON.stringify(session))
        response.setHeader('Set-Cookie',`session_id=${random};HttpOnly`);
       }
        response.end('1231') 
    })
  }else{ //这个else 是分支 if  else if   else 的最后一个
    response.statusCode = 200
    path==='/'?'/index.html':path
    const suffix =path.substring(path.lastIndexOf('.')) //suffix是后缀的单纯
    const fileTypes={
      '.html':'text/html',
      '.css':'text/css',
      '.js':'text/javascript',
      '.png':'img/png',
      '.jpeg':'image/jpeg',
      '.jpg':'image/jpg',
    }
    response.setHeader('Content-Type', `${fileTypes[suffix]||'text/html'};charset=utf-8`)
    let x
    try{
      x=fs.readFileSync(`./public${path}`)
    }catch(error){
      x='文件不存在哦,骚年'
      response.statusCode=404
    }
    response.write(x)
    response.end()
  }
  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)