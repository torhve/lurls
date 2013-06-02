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
    if(this.display.endsWith('.jpg') || this.display.endsWith('.png')) {
        this.display = '<img src='+this.url+'>';
    }
    var youtube = youtube_parser(this.url);
    if (youtube) {
        this.display = '<iframe class="youtube-player" type="text/html" width="640" height="385" src="http://www.youtube.com/embed/'+youtube+'?html5=1" allowfullscreen frameborder="0"></iframe>';
    }

}

function UrlCtrl($scope, $http) {
    $scope.urls = [];
// TODO service
    $http.get('/api/').then(function(data) {
        angular.forEach(data.data, function(urlobj) {
            $scope.urls.push(new Url(urlobj));
        });
    });
}
