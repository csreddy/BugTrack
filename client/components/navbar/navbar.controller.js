'user strict';

var app = angular.module('navbar.controllers', []);

/**
 * hide irrelelvant navbar links when user is logged in
 */

app.controller('navbarCtrl', ['$rootScope', '$location', 'User',
    function($rootScope, $location, User) {

        $rootScope.navbarUser = undefined;

        $rootScope.$on('$routeChangeSuccess', function(next, current) {
            if ($location.path() !== '/register') {
                User.getCurrentUserInfo().then(function(user) {
                    if (user) {
                        $rootScope.navbarUser = user.name;
                        $rootScope.hide = false;
                    } else {
                        $rootScope.hide = true;
                    }

                 //   console.log('====', $rootScope.navbarUser);
                }, function() {
                    $rootScope.hide = true;
                    console.log($rootScope.hide);
                });
            }
        });



        $rootScope.quickSearch = function(bugId) {
            $location.path('/bug/'+ bugId);
        };


    }
]);