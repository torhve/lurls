var lurls = angular.module('lurls', [], function($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            templateUrl: '/templates/index.html',
            controller: AppCntl})
        .when('/channel/:channelName', { templateUrl: '/templates/urls.html', controller: UrlCtrl})
        .otherwise({redirectTo: '/'});

});

lurls.factory('urlService', function($http) {
    var urls = {
        pagesShown: 1,
        pageSize: 50,
        all: [],
        getUrlsForChannel: function(channelName) {
            $http({
                url:'/api/', 
                method: 'GET',
                params: {
                    channelName: channelName,
                    page: urls.pagesShown,
                    amount: urls.pageSize
                }
            })
            .then(function(data) {
                angular.forEach(data.data, function(urlobj) {
                    urls.all.push(new Url(urlobj));
                });
            });
        },
        loadMore: function(channelName) {
            urls.pagesShown++;
            urls.getUrlsForChannel(channelName);
        }
    };
    return urls;
});

var AppCntl = function ($scope) {

};

function UrlCtrl($scope, $routeParams, urlService) {
    $scope.channelName = $routeParams.channelName;
    $scope.urls = urlService;
    // Load URLs
    urlService.getUrlsForChannel($scope.channelName);

    $scope.loadMoreUrls = function() {
        urlService.loadMore($scope.channelName);
    }
}

String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
function youtube_parser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }else{
        return false;
    }
}

function Url(urlobj) {
    angular.extend(this, urlobj);
    this.display = this.url;
    var youtube = youtube_parser(this.url);
    var urlower = this.url.toLowerCase();
    if(urlower.endsWith('.jpg') || urlower.endsWith('.png') || urlower.endsWith('.gif')) {
        this.display = '<img src='+this.url+'>';
    }
    else if (youtube) {
        this.display = '<br><iframe class="youtube-player" type="text/html" width="640" height="385" src="http://www.youtube.com/embed/'+youtube+'?html5=1" allowfullscreen frameborder="0"></iframe>';
    }
    else {
        this.display = '';
    }

    this.message = this.message.replace(this.url, '<a href="'+this.url+'">'+this.url+'</a>');


}

