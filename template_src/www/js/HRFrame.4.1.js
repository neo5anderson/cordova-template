/**
 * HRFrame 4
 * $f(function(){}) //柯理化函数
 * $f("") //调用函数
 * $f({}) //配置，缓存操作
 * Created by kingd on 2016/11/2.
 */
(function(window,document){
    "use strict";
    window._=undefined;
    //----$f core---------------------------
    var _$f=function(){
        var HRFrameValues={
            "root":"app",
            "splitChar":/\./g
        };
        var HRFrameFunctions={};

        HRFrameFunctions["df"]=function(_name,_fn){
            HRFrameFunctions[_name]=_fn;
        };

        HRFrameFunctions["curry"]=function(_fn){
            //需要的形参长度
            var argumentsLength=_fn.length;
            //暂存形参
            var arg=[];
            var rtnFn = function(){
                //真实的形参长度
                var realLength=0;
                //去掉不可用形参后真实的形参长度
                for(var i=0;i<arguments.length;i++){
                    arguments[i]!==undefined?realLength++:0;
                }
                //是否满足可调用的形参长度
                if(realLength+arg.length>=argumentsLength){
                    var realarg = [].concat(arg);
                    //这里使用重新生成的形参列表，为了保证最后一次调用不会暂存形参
                    for(var i=0;i<arguments.length;i++){
                        var j=realarg.indexOf(undefined);
                        j=j>0?j:realarg.length;
                        if(arguments[i]!==undefined){
                            realarg[j]=arguments[i];
                        }
                    }

                    return _fn.apply(HRFrameValues,realarg);
                }
                //暂存形参
                for(var i=0;i<arguments.length;i++){
                    var j=arg.indexOf(undefined);
                    j=j>0?j:arg.length;
                    if(arguments[i]!==undefined){
                        arg[j]=arguments[i];
                    }
                }

                if(arg.length<argumentsLength){
                    return rtnFn;
                }
            };
            return rtnFn;
        };

        return function(){
            switch(typeof(arguments[0])){
                case "object":

                    break;
                case "function":
                    return $f("curry",arguments[0]);
                    break;
                case "string":
                    var args = Array.apply({},arguments);
                    var params = args.slice(1);
                    if(HRFrameFunctions[args[0]]==undefined){
                        var newFN =$f("loadFNSync",args[0]);
                    }
                    return (HRFrameFunctions.curry(HRFrameFunctions[args[0]])).apply(HRFrameValues,params);
                    break;
                default:
            }
        };
    };
    var $f = window.$f=_$f();
    //----$f plugin------------------------
    $f("df","ajax.get",function(_url,_data,_fn){
        return function(){
            $.ajax({
                url:_url,
                data:_data,
                method:"GET",
                success:_fn
            });
        };
    });
    $f("df","ajax.syncget",function(_url,_data,_fn){
        return function(){
            $.ajax({
                url:_url,
                data:_data,
                method:"GET",
                async:false,
                dataType:"text",
                success:_fn
            });
        };
    });
    $f("df","ajax.post",function(_url,_data,_fn) {
        return function () {
            $.ajax({
                url:_url,
                data:_data,
                method:"POST",
                success:_fn
            });
        };
    });
    $f("df","ajax.put",function(_url,_data,_fn) {
        return function () {
            $.ajax({
                url:_url,
                data:_data,
                method:"PUT",
                success:_fn
            });
        };
    });
    $f("df","ajax.delete",function(_url,_data,_fn) {
        return function () {
            $.ajax({
                url:_url,
                data:_data,
                method:"DELETE",
                success:_fn
            });
        };
    });
    $f("df","->",function(_fn1,_fn2){
        var args = Array.apply({},arguments);
        return function(_para){
            var rtnval = _para;
            for(var i=0;i<args.length;i++){
                rtnval =args[i](rtnval);
            }
            return rtnval;
        };
    });
    $f("df","=>",function(_fn1,_fn2){
        //不可用，待完善，时有场景有限
        var args = Array.apply({},arguments);
        var datas = [];
        var ajaxFn=function(data){
            datas.push(data);
        };
        return function(){
            for(var i=0;i<args.length;i++){
            }
        }
    });
    //加载远程函数
    $f("df","loadFNSync",function(_uri){
        var setName = $f(function(filename,jscode){
          return jscode.replace("__","'"+filename+"'");
        });
        var setName=setName(_uri);
        var addAnnotation=$f(function(filename,jscode){
            return jscode +"\n\n //# sourceURL="+filename+".js"
        });
        var addAnnotation=addAnnotation(_uri);
        var evalCode = $f(function(jscode){
            var fn =new Function(jscode);
            fn();
        });
        var fileURL = $f(function(HRFrameConfig,_fileName){return HRFrameConfig.root+"/"+_fileName.replace(HRFrameConfig.splitChar,"/")+".js?time"+new Date().getMilliseconds()});
        var fileURL=fileURL(this);
        var evalFile=$f("->",setName,addAnnotation,evalCode);
        var query = $f("ajax.syncget",fileURL(_uri),{},evalFile);
        query();
    });

    //tppl 模板引擎
    $f("df","TPPL",function(tpl,_data){
        var data=_data||{};
        if(typeof(data)!="object"){
            console.log("TPPL ->data is not JSON Object");
            return null;
        }
        var fn =  function(d) {
            var i, k = [], v = [];
            for (i in d) {
                k.push(i);
                v.push(d[i]);
            };
            return (new Function(k, fn.$)).apply(d, v);
        };
        if(!fn.$){
            var tpls = tpl.split('[:');
            fn.$ = "var $empty=''; var $reg = RegExp(/object|undefined|function/i); var $=''";
            for(var t in tpls){
                var p = tpls[t].split(':]');
                if(t!=0){
                    fn.$ += '='==p[0].charAt(0)
                        ? "+($reg.test(typeof("+p[0].substr(1)+"))?$empty:"+p[0].substr(1)+")"
                        : ";"+p[0].replace(/\r\n/g, '')+"$=$"
                }
                // 支持 <pre> 和 [::] 包裹的 js 代码
                fn.$ += "+'"+p[p.length-1].replace(/\'/g,"\\'").replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n')+"'";
            }
            fn.$ += ";return $;";
            // log(fn.$);
        }
        return data ? fn(data) : fn;
    });
    $f("df","appendHTML",function(_selector,_content){
        var id = $(_content).attr("id");
        if(id!==undefined && id!==null){
                $("#"+id).remove();
                $(_selector).append(_content);
        }else{
            $(_selector).append(_content);
        }
    });
    //展示列表页面
    $f("df","list",function(_path,_param){
        var hrconfig = this;
        var querydata = $f(_path+".list.req",_param);
        var query = $f("ajax.get",querydata.url,querydata.data,function(_data){
            //获取页面
            var fileURL = $f(function(HRFrameConfig,_fileName){return HRFrameConfig.root+"/"+_fileName.replace(HRFrameConfig.splitChar,"/")});
            fileURL(hrconfig,_);
            var getPage = $f("ajax.get",fileURL(_path)+"/list.html",{},function(_page){
                $f(_path+".list.resp",_param,_page,_data);
            });
            getPage();
        });
        query();
    });
    //render
    $f("df","render",function(_path,_param){
        var hrconfig = this;
        var querydata = $f(_path+".req",_param);
        if(querydata==null){
            //获取页面
            var fileURL = $f(function(HRFrameConfig,_fileName){return HRFrameConfig.root+"/"+_fileName.replace(HRFrameConfig.splitChar,"/")});
            fileURL(hrconfig,_);
            var getPage = $f("ajax.get",fileURL(_path)+"/i.html",{},function(_page){
                $f(_path+".resp",_param,_page,null);
            });
            getPage();
        }else{
            var query = $f("ajax.get",querydata.url,querydata.data,function(_data){
                //获取页面
                var fileURL = $f(function(HRFrameConfig,_fileName){return HRFrameConfig.root+"/"+_fileName.replace(HRFrameConfig.splitChar,"/")});
                fileURL(hrconfig,_);
                var getPage = $f("ajax.get",fileURL(_path)+"/i.html",{},function(_page){
                    $f(_path+".resp",_param,_page,_data);
                });
                getPage();
            });
            query();
        }
    });
    //#f-> xxxx xxx xxx
    $(function(){
        window.addEventListener("hashchange",function(e){
            var enewURL = "";
            if(e.newURL==undefined || e.newURL==null){
                enewURL = decodeURI(location.hash);//兼容IE
            }else{
                enewURL= decodeURI(e.newURL);
            }
            var keyStr = enewURL.split("#f->")[1];
            if(keyStr != undefined){
                var params = keyStr.split(" ");
                $f.apply(e,params);
            }
        },false);
    });
})(window,document);
