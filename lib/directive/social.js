"use strict";
var app = require('../app'),
    analytics = require('../core/analytics'),
    notify = require('../api/notify');

/*
 * Social sharing directive
 */

app.directive('socialSharing', function ($rootScope, socialService, emailService) {
    return {
        restrict: 'E',
        templateUrl: '/directive/social.html',
        scope: {
            type: '='
        },
        link : function (scope) {
            var cover_url = 'http://art.kano.me/assets/challenges/images/' + $rootScope.selectedWorld.cover + '@2x.png';
            function init() {
                socialService.init();
                socialService.twitter.share(function (res) {
                    if (!res) {
                        analytics.track('Share failure', {
                            category: 'Twitter Sharing'
                        });
                        return;
                    }
                    analytics.track('Share success', {
                        category: 'Twitter Sharing'
                    });
                    return;
                });
            }

            init();

            scope.loading = false;
            scope.mailModal = false;
            scope.buildURL = socialService.twitter.build;
            scope.mailForm = {
                title: $rootScope.selectedWorld.name,
                type: 'world-invite',
                description: $rootScope.selectedWorld.socialText ? $rootScope.selectedWorld.socialText.email : null,
                cover_url: cover_url,
                url: 'http://art.kano.me/' + $rootScope.selectedWorld.id
            };

            scope.open = function () {
                scope.mailModal = true;
            };
            scope.close = function () {
                scope.mailModal = false;
            };
            scope.facebookShare = function () {
                var options = {
                    title   : $rootScope.selectedWorld.name + ' on Make Art',
                    url     : 'http://art.kano.me/challenges/' + $rootScope.selectedWorld.id,
                    picture : cover_url,
                    caption : 'Shared by ' + $rootScope.user.username + ' via ' + $rootScope.selectedWorld.name,
                    text    : $rootScope.selectedWorld.socialText.facebook
                };

                socialService.facebook.share(options, function (err, res) {
                    if (!res || err) {
                        analytics.track('Share failure', {
                            category: 'Facebook Sharing'
                        });
                        return err;
                    }
                    analytics.track('Share success', {
                        category: 'Facebook Sharing'
                    });
                });
            };

            scope.sendMail = function () {
                var emailObj;
                if (!scope.mailForm.email || !scope.mailForm.description) {
                    return;
                } else {
                    if (!emailService.validate(scope.mailForm.email)) {
                        scope.error = 'Invalid email address';
                        return;
                    }
                    scope.error = '';
                    scope.loading = true;
                    scope.mailForm.user_email = $rootScope.user.email;
                    scope.mailForm.username = $rootScope.user.username;
                    emailObj = emailService.buildObject(scope.mailForm);

                    emailService.send(emailObj, function (res) {
                        if (res.status !== 200) {
                            analytics.track('Email failure', {
                                category: 'Email Sharing'
                            });
                            scope.loading = false;
                            scope.$apply();
                            return notify.failure(res);
                        }
                        emailService.reset(scope.mailForm);
                        analytics.track('Email success', {
                            category: 'Email Sharing'
                        });

                        scope.loading = false;
                        scope.close();
                        scope.$apply();

                        return notify.success();
                    }, function (error) {
                        analytics.track('Email failure', {
                            category: 'Email Sharing'
                        });
                        scope.loading = false;
                        scope.$apply();
                        return notify.failure(error);
                    });
                }
            };
        }
    };
});
