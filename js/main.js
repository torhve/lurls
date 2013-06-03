var lurls = angular.module('lurls', [], function($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            templateUrl: '/templates/index.html',
            controller: AppCntl})
        .when('/channel/:channelName', { templateUrl: '/templates/urls.html', controller: UrlCtrl})
        .otherwise({redirectTo: '/'});

});

lurls.factory('urlService', ['$http', 'youtube', function($http, youtube) {
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
                    urls.all.push(new Url(urlobj, youtube, $http));
                });
            });
        },
        loadMore: function(channelName) {
            urls.pagesShown++;
            urls.getUrlsForChannel(channelName);
        }
    };
    return urls;
}]);

var AppCntl = function ($scope) {

};

function UrlCtrl($scope, $routeParams, urlService, youtube) {
    $scope.channelName = $routeParams.channelName;
    $scope.urls = urlService;
    // Load URLs
    urlService.getUrlsForChannel($scope.channelName);

    $scope.loadMoreUrls = function() {
        urlService.loadMore($scope.channelName);
    }
    $scope.urlToID = function(url) {
        return youtube.urlToID(url);
    }
    $scope.formatDuration = function(seconds) {
        return youtube.formatDuration(seconds);
    }
    $scope.getLink = function(video, index) {
        return '#/view/' + youtube.urlToID(video.media$group.yt$videoid.$t);
    }
    $scope.embedVideo = function(index)  {
        console.log(index);
        var url = $scope.urls.all[index];
        console.log(url);
        url.display = '<br><iframe class="youtube-player" type="text/html" width="640" height="385" src="'+url.video.embedurl+'" allowfullscreen frameborder="0"></iframe>';
        url.video = false;
        //$scope.$apply(function() { });
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

function Url(urlobj, youtube, http) {
    var that = this;
    angular.extend(this, urlobj);
    this.display = this.url;
    var yid = youtube_parser(this.url);
    console.log(yid);
    var urlower = this.url.toLowerCase();
    if(urlower.endsWith('.jpg') || urlower.endsWith('.png') || urlower.endsWith('.gif')) {
        this.display = '<img src='+this.url+'>';
    }
    else if (yid) {
        this.display = '<br><iframe class="youtube-player" type="text/html" width="640" height="385" src="http://www.youtube.com/embed/'+yid+'?html5=1" allowfullscreen frameborder="0"></iframe>';
        this.display = '';
        //this.video = youtube.getItem('videos', yid);
        var type = 'videos';
        var callback = 'JSON_CALLBACK';
        var url = 'https://gdata.youtube.com/feeds/api/' + type + '/' + yid + '?safeSearch=none&v=2&alt=json&callback=' + callback;
        http.jsonp(url).success(function(data) {
            that.video = data.entry;
            console.log(that.video);
            that.video.video_id = yid;
            that.video.embedurl = "http://www.youtube.com/embed/" + that.video.video_id + "?html5=1&autoplay=1&theme=light&color=white&iv_load_policy=3&origin=http://irc.lart.no";
        });
    }
    else {
        this.display = '';
    }

    this.message = this.message.replace(this.url, '<a href="'+this.url+'">'+this.url+'</a>');


    this.nick = '<span style="color:'+stringToColour(this.nick)+'">'+this.nick+'</span>';

}

var stringToColour = function(str) {

    // str to hash
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

    // int/hash to hex
    for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

    return colour;
}
