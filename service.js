var http = require('http'),
    url = require('url'),
    superagent = require('superagent'),
    cheerio = require('cheerio'),
    async = require('async'),
    eventproxy = require('eventproxy');


var ep = new eventproxy(),
    pageUrls = [],
    urlsArr = [],
    pageNum = 1;

for (var i = 1; i <= pageNum; i++) {
    pageUrls.push('https://stackoverflow.com/questions/tagged/javascript?page=' + i + '&sort=newest&pagesize=15');
}





function start() {
    function onRequest(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' });
        ep.after('StackArticleUrl', pageUrls.length * 20, function(articleUrls) {
            for (var i = 0; i < articleUrls.length; i++) {
                res.write('____1111____' + articleUrls[i] + '<br/>');
            }
            //控制并发数
            // var curCount = 0;
            var reptileMove = function(url, callback) {
                var delay = parseInt((Math.random() * 30000000) % 1000, 10);
                // curCount++;
                // console.log('现在的并发数是', curCount, '，正在抓取的是', url, '，耗时' + delay + '毫秒');

                superagent.get('https://stackoverflow.com' + url).end(function(err, sres) { //点击标题进入下一个页面
                    if (err) {
                        console.log(err);
                        return;
                    }
                    var $ = cheerio.load(sres.text);
                    // var questionName = $('#question-header').find('a').attr('href');
                    res.write('______222______' + url + '<br/>');
                    var title = $('.question-hyperlink').html();
                    res.write('_____hhhh__' + title + '<br/>');
                });
                setTimeout(function() {
                    // curCount--;
                    callback(null, 'https://stackoverflow.com' + url);
                    console.log('____333____' + url);
                }, delay);
            };

            async.mapLimit(articleUrls, 5, function(url, callback) { //async.mapLimit第一个参数 urls 为数组，保存了需要爬取页面的 100 个 url，第二个参数 5 表示并发爬取数量为 5，第三个参数是迭代函数（每个 url 需要执行这个函数），其第一个参数 url，是 urls 数组的每个 item，第二个参数 callback 与 mapLimit 方法第四个参数有关，callback 会往 result 参数里存放数据。如何理解？callback 是第三个参数 iterator 的回调，以爬虫为例，爬完页面肯定会分析一些数据，然后保存，执行 callback 函数就能把结果保存在 result（第四个参数函数中的参数） 中。
                reptileMove(url, callback);
                console.log('__444___');
            }, function(err, result) {
                res.write('_____555____' + result + '<br/>');
            })
        });

        pageUrls.forEach(function(pageUrl) { //遍历pageUrls得到每页的url即pageUrl
            superagent.get(pageUrl).end(function(err, pres) { //访问pageUrl
                var $ = cheerio.load(pres.text);
                $('.question-hyperlink').each(function() { //遍历一个页面所有的标题
                    var articleUrl = $(this).attr('href');
                    urlsArr.push(articleUrl)
                    ep.emit('StackArticleUrl', articleUrl)
                });
                // console.log(urlsArr);
            });
        });
    }
    http.createServer(onRequest).listen(3200, "127.0.0.1")
}
// exports.start = start;

start()