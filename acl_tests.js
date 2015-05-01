var test = require("tap").test;
run(require('./env.config'), test);

/*
 These integration tests work by creating an ACL with a user and checking ACL permissions all work properly.
 The ACl is recycled for objects created by another user and permissions are checked. Also checks to ensure
 only object creator and members can see the object.
 */
function run(opts, test) {
  var users_lib = require('./lib/users');

  var users = users_lib(opts);

  var adminUser = {
    username: 'admin@cloudmine.me',
    password: 'admin',
    __id__: '0454e7b4e5b84139a1ca8c2a72361524'
  };
  var aclOwningUser = {
    username: 'owner@cloudmine.me',
    password: 'owner'
  };
  var nonAclUser = {
    username: 'consumer@cloudmine.me',
    password: 'consumer'
  };

  var test_users = [adminUser, aclOwningUser, nonAclUser];

  var adminACL = {
    "members": [], // will be admin user
    "__type__": "acl",
    "permissions": ["c", "r", "u", "d"]
  };

  var appLvlObjAccessTxt = "random data in pointless access attr";
  var appLvlObj = {
    "__id__": "APPLVLSPECIALUNIQUEIDENTIFIER",
    "__class__": "SplatAppLvl",
    "__access__": [appLvlObjAccessTxt],
    "text": "This splat should be shared with the application"
  };

  var sharedObj = {
    "__id__": "SPECIALUNIQUEIDENTIFIER",
    "__class__": "Splat",
    "text": "This splat should be shared with the admin user"
  };

  // obj search query
  var search_query = {__class__: "Splat"};
  var search_query_app_lvl = {__class__: "SplatAppLvl"};
  var search_query_by_id = '[__class__ = "Splat", __id__ = "SPECIALUNIQUEIDENTIFIER"]';
  var search_query_by_id_app_lvl = '[__class__ = "Splat", __id__ = "APPLVLSPECIALUNIQUEIDENTIFIER"]';

  test("ACL Integration Tests", function (t) {

    t.test("delete users", function (t) {
      users.delete_all(function (err) {
        t.ok(!err, "all users deleted");
        t.end();
      });
    });

    t.test("create users", function (t) {
      t.plan(1);

      users.create_multi(test_users, function (err, users) {
        t.ok(!err, "users created: " + JSON.stringify(users));
      });
    });

    t.test("login users", function (t) {
      t.plan(1);

      users.login_multi(test_users, function (err, ws_list) {
        t.ok(!err, "users loggedin: " + JSON.stringify(ws_list));
      });
    });

    // perform pre tests here -- assumptions about other potentially affected components

    t.test("Pre test app level access can be added to object by owner", function (t) {
      aclOwningUser.ws.set(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        appLvlObj.__id__ = Object.keys(data)[0];

        // now that a shared object was created lets check what's been shared with this user
        t.test("Can read arbitrary __access__ field on app level obj", function (t) {
          aclOwningUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(appLvlObjAccessTxt, data[appLvlObj.__id__]["__access__"][0], "Access saved on app level object");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not created");
        t.end();
      });
    });

    t.test("Pre test app level access can be modified on object by owner", function (t) {
      var modifiedAccessAttr = appLvlObjAccessTxt + "modified";
      appLvlObj.__access__ = [modifiedAccessAttr];
      aclOwningUser.ws.update(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can modify arbitrary __access__ field on app level obj", function (t) {
          aclOwningUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(modifiedAccessAttr, data[appLvlObj.__id__]["__access__"][0], "Access updated on app level object");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not updated");
        t.end();
      });
    });

    t.test("Pre test app level access can be deleted on object by owner", function (t) {
      delete appLvlObj["__access__"];
      aclOwningUser.ws.update(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can delete arbitrary __access__ field on app level obj", function (t) {
          aclOwningUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(false, appLvlObj.hasOwnProperty("__access__"), "Access deleted on app level object");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not updated");
        t.end();
      });
    });

    t.test("Pre test app level access can be added to object by non owner", function (t) {
      appLvlObj.__access__ = [appLvlObjAccessTxt];
      nonAclUser.ws.update(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can add arbitrary __access__ field on app level obj", function (t) {
          nonAclUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(appLvlObjAccessTxt, data[appLvlObj.__id__]["__access__"][0], "Access added on app level object by non owner");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not updated");
        t.end();
      });
    });

    t.test("Pre test app level access can be modified on object by non owner", function (t) {
      var modifiedAccessAttr = appLvlObjAccessTxt + "modified";
      appLvlObj.__access__ = [modifiedAccessAttr];
      nonAclUser.ws.update(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can modify arbitrary __access__ field on app level obj", function (t) {
          nonAclUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(modifiedAccessAttr, data[appLvlObj.__id__]["__access__"][0], "Access updated on app level object by non owner");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not updated");
        t.end();
      });
    });

    t.test("Pre test app level access can be deleted on object by non owner", function (t) {
      delete appLvlObj["__access__"];
      nonAclUser.ws.update(appLvlObj.__id__, appLvlObj, { applevel: true }).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can delete arbitrary __access__ field on app level obj", function (t) {
          nonAclUser.ws.search(search_query_app_lvl, { applevel: true }).on('success', function (data, response) {
            t.equal(false, appLvlObj.hasOwnProperty("__access__"), "Access deleted on app level object by non owner");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("App level object not updated");
        t.end();
      });
    });

    // perform tests here --

    t.test("Can grant permissions to user through ACL", function (t) {
      adminACL.members = [adminUser.id];

      aclOwningUser.ws.updateACL(adminACL).on('success', function (data, response) {
        adminACL = data[Object.keys(data)[0]];
        sharedObj.__access__ = [adminACL.__id__];

        aclOwningUser.ws.set(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          sharedObj.__id__ = Object.keys(data)[0];

          // now that a shared object was created lets check what's been shared with this user
          t.test("Can grant READ to user through ACL", function (t) {
            aclOwningUser.ws.search(search_query, {shared_only: true}).on('success', function (data, response) {
              t.equal(0, Object.keys(data).length, 'Data shared w/ creator (should be empty)');

              aclOwningUser.ws.search(search_query).on('success', function (data, response) {
                t.notEqual(0, Object.keys(data).length, 'Data created by user (shouldn\'t be empty)');
                t.end();
              });
            });
          });
        }).on('error', function (data, response) {
          t.bailout("Shared object not created");
          t.end();
        });
      }).on('error', function (data, response) {
        t.bailout("ACL not created");
        t.end();
      });
    });

    t.test("Can grant permissions to user through ACL from another user", function (t) {
      var nonAclOwnerSharedObj = {
        "__id__": "NONACLSHAREDUNIQUEIDENTIFIER",
        "__class__": "SplatNonACLOwnerShared",
        "text": "This splat should be shared with the admin user",
        "__access__": [adminACL.__id__]
      };

      var non_acl_owner_shared_search_query = {__class__: "SplatNonACLOwnerShared"};

      nonAclUser.ws.set(nonAclOwnerSharedObj.__id__, nonAclOwnerSharedObj).on('success', function (data, response) {
        // now that a shared object was created lets check what's been shared with this user
        t.test("Can grant READ to user through ACL", function (t) {
          adminUser.ws.search(non_acl_owner_shared_search_query, {shared_only: true}).on('success', function (data, response) {
            t.notEqual(0, Object.keys(data).length, 'Data shared w/ creator (shouldn\'t be empty)');
            t.equal(nonAclOwnerSharedObj["__id__"], data[nonAclOwnerSharedObj["__id__"]]["__id__"], "Returns proper identifier");
            t.equal(nonAclOwnerSharedObj["__class__"], data[nonAclOwnerSharedObj["__id__"]]["__class__"], "Returns proper class");
            t.equal(nonAclOwnerSharedObj["text"], data[nonAclOwnerSharedObj["__id__"]]["text"], "Returns proper text");
            t.end();
          });
        });
      }).on('error', function (data, response) {
        t.bailout("Shared object not created");
        t.end();
      });
    });


    t.test("Owner can update access list", function(t){
      sharedObj.__access__.push("bunk user id");

      // first set the object with an updated __access__ field, then make sure it's saved
      aclOwningUser.ws.set(sharedObj.__id__, sharedObj).on('success', function (data, response) {
        aclOwningUser.ws.get(sharedObj.__id__).on('complete', function (data, response) {
          t.same(sharedObj, data.success[sharedObj.__id__], "access field updated");
          t.end();
        });
      }).on('error', function (data, response) {
        t.bailout("Shared object not created");
        t.end();
      });
    });

    t.test("Can prevent read ACL objects", function (t) {
      nonAclUser.ws.search(search_query, {shared_only: true}).on('success', function (data, response) {
        t.equal(200, response.status, 'search shared 200 response');
        t.equal(0, Object.keys(data).length, 'Data shared w/ non ACL user (should be empty)');

        nonAclUser.ws.search(search_query).on('success', function (data, response) {
          t.equal(200, response.status, 'search shared 200 response');
          t.equal(0, Object.keys(data).length, 'Data created by admin (should be empty)');
          t.end();
        });
      });
    });


    t.test("Non ACL member can't update ACL objects", function (t) {
      t.test("Can prevent UPDATE to user through ACL", function (t) {
        sharedObj.illegalText = 'the non ACL member added this text';

        nonAclUser.ws.update(sharedObj.__id__, sharedObj).on('error', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.same({
            401: {
              'SPECIALUNIQUEIDENTIFIER': {
                'errors': ['permission denied']
              }
            }
          }, data, 'Non ACL shared user can\'t delete object');
          t.end();
        });
      });
    });


    t.test("Non ACL member can't delete ACL objects", function (t) {
      t.test("Can prevent DELETE to user through ACL", function (t) {
        // check that shared user can delete the object
        nonAclUser.ws.destroy(sharedObj.__id__).on('error', function (data, response) {
          t.equal(200, response.status, 'delete shared 200 response');
          t.same({
            401: {
              'SPECIALUNIQUEIDENTIFIER': {
                'errors': ['permission denied']
              }
            }
          }, data, 'Non ACL shared user can\'t delete object');
          t.end();
        });
      });
    });


    /*

     Test that an ACL allows a permissioned user to read objects from the API. Tests delete
     user objects in the setup so admin user data store will be emptied out running this.

     */
    t.test("ACL member can exercise read permissions", function (t) {
      adminUser.ws.search(search_query, {shared_only: true}).on('success', function (data, response) {
        t.equal(200, response.status, 'search shared 200 response');
        t.notEqual(0, Object.keys(data).length, 'Data shared w/ admin (shouldn\'t be empty)');
        t.same(sharedObj.__id__, Object.keys(data)[0], 'admin has shared object in shared list');

        adminUser.ws.search(search_query).on('success', function (data, response) {
          t.equal(200, response.status, 'search shared 200 response');
          t.equal(0, Object.keys(data).length, 'Data created by admin (should be empty)');
          t.end();
        });
      });
    });


    /*

     Test that the ACL works allowing updates via another user when permissions
     exist through an ACL.

     */
    t.test("ACL member can exercise update permissions", function (t) {
      t.test("Can grant UPDATE to user through ACL", function (t) {
        sharedObj.adminText = 'the ACL member added this text';

        adminUser.ws.update(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          t.equal(200, response.status, 'search shared 200 response');
          t.equal(data["SPECIALUNIQUEIDENTIFIER"], 'updated', 'ACL shared user can update object');
          t.end();
        }).on('error', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.equal(data.adminText, 'the ACL member added this text', 'ACL shared user can update object');
          t.end();
        });
      });
    });

    /*

     POST: Giving a user permission to update an object should not also allow them to
     modify the access list. Only the object owner should be able to modify the
     access list on an object

     */
    t.test("POST: Update permission doesn't permit changes to the access list", function (t) {
      t.test("Can UPDATE non access members through ACL", function (t) {
        sharedObj.__access__ = [];
        sharedObj.adminText = "update permission doesn't permit changes to the access list";

        adminUser.ws.update(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.equal(data["SPECIALUNIQUEIDENTIFIER"], 'updated', 'ACL shared user can update object');

          adminUser.ws.search(search_query_by_id, {shared_only: true}).on('success', function (data, response) {
            // check access isn't empty meaning the access list wasn't modified
            // check the object to ensure the changed member was set
            t.equal(sharedObj.adminText, data["SPECIALUNIQUEIDENTIFIER"].adminText, "admin updated text");
            t.notEqual([], data["SPECIALUNIQUEIDENTIFIER"].__access__, "admin wasn't able to update the access list");

            sharedObj = data["SPECIALUNIQUEIDENTIFIER"];
            t.end();
          });
        }).on('error', function (data, response) {
          t.bailout("update failed on POST with access list modified");
          t.end();
        });
      });

    });

    /*

     POST: Same as previous except removing the access property entirely.

     */
    t.test("POST: Update permission doesn't permit changes to the access list", function (t) {
      t.test("Can UPDATE non access members through ACL", function (t) {
        delete sharedObj["__access__"];
        sharedObj.adminText = "update permission doesn't permit removal of the access list";

        adminUser.ws.update(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.equal(data["SPECIALUNIQUEIDENTIFIER"], 'updated', 'ACL shared user can update object');

          adminUser.ws.search(search_query_by_id, {shared_only: true}).on('success', function (data, response) {
            // check access isn't empty meaning the access list wasn't modified
            t.equal(sharedObj.adminText, data["SPECIALUNIQUEIDENTIFIER"].adminText, "admin updated text");
            t.notEqual([], data["SPECIALUNIQUEIDENTIFIER"].__access__, "admin wasn't able to update the access list");

            sharedObj = data["SPECIALUNIQUEIDENTIFIER"];
            t.end();
          });
        }).on('error', function (data, response) {
          t.bailout("update failed on POST with access list deleted");
          t.end();
        });
      });

    });

    /*

     PUT: Giving a user permission to update an object should not also allow them to
     modify the access list. Only the object owner should be able to modify the
     access list on an object

     */
    t.test("PUT: Update permission doesn't permit changes to the access list", function (t) {
      t.test("Can UPDATE non access members through ACL", function (t) {
        sharedObj.__access__ = [];
        sharedObj.adminText = "update permission doesn't permit changes to the access list";

        adminUser.ws.set(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.equal(data["SPECIALUNIQUEIDENTIFIER"], 'updated', 'ACL shared user can update object');

          adminUser.ws.search(search_query_by_id, {shared_only: true}).on('success', function (data, response) {
            // check access isn't empty meaning the access list wasn't modified
            t.equal(sharedObj.adminText, data["SPECIALUNIQUEIDENTIFIER"].adminText, "admin updated text");
            t.notEqual([], data["SPECIALUNIQUEIDENTIFIER"].__access__, "admin wasn't able to update the access list");

            sharedObj = data["SPECIALUNIQUEIDENTIFIER"];
            t.end();
          });
        }).on('error', function (data, response) {
          t.bailout("update failed on PUT with access list modified");
          t.end();
        });
      });

    });

    /*

     PUT: Same as previous except removing the access property entirely.

     */
    t.test("PUT: Update permission doesn't permit changes to the access list", function (t) {
      t.test("Can UPDATE non access members through ACL", function (t) {
        delete sharedObj["__access__"];
        sharedObj.adminText = "update permission doesn't permit removal of the access list with access key removed";

        adminUser.ws.set(sharedObj.__id__, sharedObj).on('success', function (data, response) {
          t.equal(200, response.status, 'update shared 200 response');
          t.equal(data["SPECIALUNIQUEIDENTIFIER"], 'updated', 'ACL shared user can update object');

          adminUser.ws.search(search_query_by_id, {shared_only: true}).on('success', function (data, response) {
            // check access isn't empty meaning the access list wasn't modified
            t.equal(sharedObj.adminText, data["SPECIALUNIQUEIDENTIFIER"].adminText, "admin updated text");
            t.notEqual([], data["SPECIALUNIQUEIDENTIFIER"].__access__, "access list is not empty");

            sharedObj = data["SPECIALUNIQUEIDENTIFIER"];
            t.end();
          });
        }).on('error', function (data, response) {
          t.bailout("update failed on POST with access list deleted");
          t.end();
        });
      });

    });

    /*

     Test that the ACL works allowing updates via another user when permissions
     exist through an ACL.

    */
    t.test("ACL member can exercise delete permissions", function (t) {
      t.test("Can grant DELETE to user through ACL", function (t) {
        // check that shared user can delete the object
        adminUser.ws.destroy(sharedObj.__id__).on('success', function (data, response) {
          t.same({'SPECIALUNIQUEIDENTIFIER': 'deleted'}, data, 'ACL shared user can delete object');
          t.end();
        }).on('error', function (data, response) {
          t.equal(200, response.status, 'delete shared 200 response');
          t.end();
        });
      });

    });


  // ---------------------

    t.test("delete all users to clean up", function(t){
      users.delete_all(function(err){
        t.ok(!err, "all users deleted");
        t.end();
      });
    });

  });
}

module.exports = run;
