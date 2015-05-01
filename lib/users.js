var cm = require("cloudmine");
var async = require('async');

function users_lib(opts){
  var master = new cm.WebService({apiroot: opts.apiroot, appid: opts.appid, apikey: opts.masterkey});

  var master_api = function(action, args, cb){
    if(typeof args == "function"){
      cb = args;
      args = [];
    }

    if(!Array.isArray(args)){
      args = [args];
    }

    action.apply(master, args).on("success", function(result){
      cb(null, result)
    }).on("error", function(err){
      cb(err);
    });
  };

  var users = {
    delete_all: function(cb){
      master_api(master.allUsers, {limit: -1}, function(err, users){
        // console.log("users:", users); // users indexed by id
        async.each(Object.keys(users), function iter(userid, cb){
          master_api(master.deleteUser, userid, cb)
        }, function (err){
             // console.log("all users deleted");
             cb(err);
           });
      });
    },

    /**
     * Auth is {email, username, password}
     */
    create: function(auth, cb){
      console.log("creating user", auth);
      master_api(master.createUser, auth, function(err, user){
        if(!err){
          // inject responses in to auth object and extract id
          auth.user = user;
          auth.id = user.__id__;
        }
        cb(err, auth);
      });
    },

    create_multi: function(auths, cb){
      async.map(auths, users.create, function(err, users){
        cb(err, auths);
      });
    },

    /**
     * returns a webservice used to interact with that user's data
     *
     * credentails is an object with username, email, password
     */
    login: function(credentials, cb){
      var ws = new cm.WebService({apiroot: opts.apiroot, appid: opts.appid, apikey: opts.apikey});
      ws.login(credentials).on("success", function(login_info){
        // inject responses in to credentials object
        credentials.ws = ws;
        cb(null, ws);
      }).on("error", function(err){
        cb(err);
      });
    },

    login_multi: function(credentials_list, cb){
      async.map(credentials_list, users.login, function(err, webservices){
        cb(err, webservices);
      });
    }
  };

  return users;
}

module.exports = users_lib;