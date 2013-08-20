Controllers.controller("LoginCtrl",
    ["$scope", "$http", "$rootScope", "$location", "$timeout", "$filter",
    "$cookies", "Connection", "User", "Channel", "Parser",
    function ($scope, $http, $rootScope, $location, $timeout, $filter,
    $cookies, Connection, User, Channel, Parser)
    {
        var mustKill = false;
        Connection.close();
        $scope.displayModal = false;
        $scope.modalOpts =
            {
                backdropFade: true,
                dialogFade: true
            };
        $scope.user = User.get("~");
        $scope.user.nickName = $cookies.nickName;
        if ($cookies.color)
        {
            $scope.user.color = $cookies.color;
        }

        $location.hash("");

        $http.jsonp("http://freegeoip.net/json/?callback=JSON_CALLBACK")
        .success(function (data)
        {
            $scope.user.country = data.country_name;
            $scope.user.flag = data.country_code;
        });

        $scope.openModal = function ()
        {
            $scope.displayModal = true;
        }

        $scope.closeModal = function ()
        {
            $scope.displayModal = false;
        }

        $rootScope.$on("err_nicknameinuse", function (evt)
        {
            if ($scope.user.password)
            {
               Connection.send("NICK " + $scope.user.nickName + "_");

                mustKill = true;

                return;
            }

            Connection.close();
            $scope.connecting = false;
            $scope.openModal();
        });

        $scope.connecting = false;

        $scope.login = function ()
        {
            var port = 81;
            User.register($scope.user.nickName);
            User.alias("~", $scope.user.nickName);
            if ($scope.connecting === false)
            {
                $scope.connecting = true;
                var hostToken = "";

                $http.jsonp("http://kaslai.us/coldstorm/fixip.php?nick=" +
                    encodeURI($scope.user.nickName) + "&random=" +
                    Math.floor(Math.random() * 10000000));

                $cookies.nickName = $scope.user.nickName;
                $cookies.color = $scope.user.color;

                hostToken = md5($scope.user.nickName);
                
                Connection.connect("ws://frogbox.es:" + port);
                var setup = function(){
                    Connection.onOpen(function ()
                    {
                        Connection.send("NICK " + $scope.user.nickName);
                        Connection.send("USER " +
                            $scope.user.color.substring(1).toUpperCase() +
                            $scope.user.flag + " - - :New coldstormer");
                        port = -1;

                        Connection.onWelcome(function ()
                        {
                            if (mustKill)
                            {
                                Connection.send("PRIVMSG NickServ :GHOST " +
                                    $scope.user.nickName + " " +
                                    $scope.user.password);
                            }

                            if ($scope.user.password)
                            {
                                Connection.send("PRIVMSG NickServ :identify " +
                                    $scope.user.password);
                            }

                            if (hostToken)
                            {
                                Connection.send("PRIVMSG Jessica :~fixmyip " +
                                    hostToken);
                            }
                        });
                    });

                    Connection.onMessage(function (message)
                    {
                        if (message.indexOf("NOTICE " + $scope.user.nickName +
                            " :Tada") > -1)
                        {
                            if (VERSION == "local")
                            {
                                var test = Channel.register("#test");

                                test.join();

                                $location.path("/channels/#test");
                            } else
                            {
                                var cs = Channel.register("#Coldstorm");
                                var two = Channel.register("#2");

                                cs.join();
                                two.join();

                                $location.path("/channels/#Coldstorm");
                            }
                        }

                        if (message.indexOf("NOTICE " +$scope.user.nickName +
                            "_ :Ghost with your nick has been killed.") > -1 &&
                            mustKill)
                        {
                            Connection.send("NICK " + $scope.user.nickName);
                            Connection.send("PRIVMSG NickServ :IDENTIFY " +
                                $scope.user.password);

                            mustKill = false;

                            if (hostToken)
                            {
                                Connection.send("PRIVMSG Jessica :~fixmyip " +
                                    hostToken);
                            }
                        }

                        $scope.connecting = false;

                        Parser.parse(message);
                    });

                    Connection.onClose(function ()
                    {
                        if( port < 85 && port > 0 ){
                            
                            window.setTimeout( function(){
                                port++;                                
                                Connection.connect("ws://frogbox.es:" + port); 
                                setup(); 
                                }, 1000 );
                            
                        }
                        else{
                            $location.path("/login");
                        }
                    });
                    
                };
                setup();
            }
        };
    }]);
