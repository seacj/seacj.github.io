var SONGLRC = "";  // 歌词

generateAudio();  // 将代码挂载到DOM上
initAudioEvent();  //初始化音频控制事件

function initAudioEvent() {
    var audio = document.getElementById('music-real-audio');

    // 点击播放/暂停图片时，控制音乐的播放与暂停
    document.getElementById('audioPlayer').onclick = function () {
        // 监听音频播放时间并更新进度条
        audio.addEventListener('timeupdate', function () {
            updateProgress(audio);
        }, false);

        // 监听播放完成事件
        audio.addEventListener('ended', function () {
            audioEnded();
        }, false);

        // 改变播放/暂停图片
        let avatar_wrapper = document.getElementsByClassName('avatar-wrapper');
        if (audio.paused) {
            // 开始播放当前点击的音频
            audio.play();
            document.getElementById("audioPlayer").className = "iconfont icon-pause avatar";

            for (var i = 0; i < avatar_wrapper.length; i++) {
                avatar_wrapper[i].style.animationPlayState = "running";
            }
            document.getElementById("audioPlayer").style.animationPlayState = "running";
        } else {
            audio.pause();

            document.getElementById("audioPlayer").className = "iconfont icon-play avatar";

            for (var i = 0; i < avatar_wrapper.length; i++) {
                avatar_wrapper[i].style.animationPlayState = "paused";
            }
            document.getElementById("audioPlayer").style.animationPlayState = "paused";
        }
    };

    // 点击进度条跳到指定点播放
    document.getElementById('progressBarBg').onmousedown = function (e) {
        // 只有音乐开始播放后才可以调节，已经播放过但暂停了的也可以
        if (!audio.paused || audio.currentTime != 0) {
            var pgsWidth = document.getElementsByClassName('progress-bar-bg')[0].clientWidth;
            var rate = e.offsetX / pgsWidth;
            audio.currentTime = audio.duration * rate;
            updateProgress(audio);
        }
    };

    getTotalTime(audio)
    dragProgressDotEvent(audio);
}

/**
 * 鼠标拖动进度点时可以调节进度
 * @param {*} audio 
 */
function dragProgressDotEvent(audio) {
    var dot = document.getElementById('progressDot');

    var position = {
        oriOffestLeft: 0, // 移动开始时进度条的点距离进度条的偏移值
        oriX: 0, // 移动开始时的x坐标
        maxLeft: 0, // 向左最大可拖动距离
        maxRight: 0 // 向右最大可拖动距离
    };
    var flag = false; // 标记是否拖动开始

    // 鼠标按下时
    dot.addEventListener('mousedown', down, false);
    dot.addEventListener('touchstart', down, false);

    // 开始拖动
    document.addEventListener('mousemove', move, false);
    document.addEventListener('touchmove', move, false);

    // 拖动结束
    document.addEventListener('mouseup', end, false);
    document.addEventListener('touchend', end, false);

    function down(event) {
        if (!audio.paused || audio.currentTime != 0) { // 只有音乐开始播放后才可以调节，已经播放过但暂停了的也可以
            flag = true;

            position.oriOffestLeft = dot.offsetLeft;
            position.oriX = event.touches ? event.touches[0].clientX : event.clientX; // 要同时适配mousedown和touchstart事件
            position.maxLeft = position.oriOffestLeft; // 向左最大可拖动距离
            position.maxRight = document.getElementById('progressBarBg').offsetWidth - position.oriOffestLeft; // 向右最大可拖动距离

            // 禁止默认事件（避免鼠标拖拽进度点的时候选中文字）
            if (event && event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }

            // 禁止事件冒泡
            if (event && event.stopPropagation) {
                event.stopPropagation();
            } else {
                window.event.cancelBubble = true;
            }
        }
    }

    function move(event) {
        if (flag) {
            var clientX = event.touches ? event.touches[0].clientX : event.clientX; // 要同时适配mousemove和touchmove事件
            var length = clientX - position.oriX;
            if (length > position.maxRight) {
                length = position.maxRight;
            } else if (length < -position.maxLeft) {
                length = -position.maxLeft;
            }

            var pgsWidth = document.getElementsByClassName('progress-bar-bg')[0].clientWidth;
            var rate = (position.oriOffestLeft + length) / pgsWidth;
            audio.currentTime = audio.duration * rate;
            updateProgress(audio);
        }
    }

    function end() {
        flag = false;
    }
}

/**
 * 更新进度条与当前播放时间
 * @param {object} audio - audio对象
 */
function updateProgress(audio) {
    var value = audio.currentTime / audio.duration;
    document.getElementById("progressBar").style.width = 'width', value * 100 + '%';
    document.getElementById("progressDot").style.left = value * 100 + '%';
    document.getElementById('audioCurTime').innerText = transTime(audio.currentTime);

    setLrc(audio);
}

/**
 * 播放完成时把进度调回开始的位置
 */
function audioEnded() {
    document.getElementById("progressBar").style.width = '0';
    document.getElementById("progressDot").style.left = '0';
    document.getElementById('audioCurTime').innerText = transTime(0);
    document.getElementById("audioPlayer").className = "iconfont icon-play avatar";
}

/**
 * 音频播放时间换算
 * @param {number} value - 音频当前播放时间，单位秒
 */
function transTime(value) {
    var time = "";
    var h = parseInt(value / 3600);
    value %= 3600;
    var m = parseInt(value / 60);
    var s = parseInt(value % 60);
    if (h > 0) {
        time = formatTime(h + ":" + m + ":" + s);
    } else {
        time = formatTime(m + ":" + s);
    }

    return time;
}

/**
 * 格式化时间显示，补零对齐
 * eg：2:4  -->  02:04
 * @param {string} value - 形如 h:m:s 的字符串 
 */
function formatTime(value) {
    var time = "";
    var s = value.split(':');
    var i = 0;
    for (; i < s.length - 1; i++) {
        time += s[i].length == 1 ? ("0" + s[i]) : s[i];
        time += ":";
    }
    time += s[i].length == 1 ? ("0" + s[i]) : s[i];

    return time;
}


/**
 * 获取音频总时间
 */
function getTotalTime(audio) {
    if (audio === null) {
        document.getElementById('audioTotalTime').innerText = transTime(0);
    } else {
        audio.load();
        audio.oncanplay = function () {
            document.getElementById('audioTotalTime').innerText = transTime(audio.duration);
        }
    }
}


/**
 * 将代码挂载到DOM上
 */
function generateAudio() {
    let html = `
    <div id="music-wrapper">
        <link rel="stylesheet" type="text/css" href="/html5-musicplayer/index.css">
        <div id="music-avatar">
            <div id="avatar-bgimg"></div>
            <div class="avatar-wrapper">
                <img class="avatar" id="song-avatar" src="" alt="avatar" class="avatar">
            </div>
            <div class="avatar-wrapper">
                <span class="iconfont icon-play avatar" id="audioPlayer" ></span>
            </div>
        </div>

        <div id="music-info-wrapper">
            <div id="music-info">
                <div id="music-baseinfo">
                    <span id="music-title"></span>
                    <span id="music-author"></span>
                </div>
                <div id="music-lrc">
                </div>
            </div>
            <!-- <div id="music-author"></div> -->

            <div id="music-controller">
                <audio id="music-real-audio" src="">Your browser does not support it!</audio>
                <div class="progress-bar-bg" id="progressBarBg">
                    <span id="progressDot"></span>
                    <div class="progress-bar" id="progressBar"></div>
                </div>
                <div class="audio-time">
                    <span class="audio-length-current" id="audioCurTime">00:00</span>
                    <span class="audio-length-total" id="audioTotalTime">00:00</span>
                </div>
            </div>
        </div>
    </div>
    <div id="music-wrapper-bg"></div>
    <iframe hidden="true" id="for-getsonglrc" name="for-getsonglrc" src=""></iframe>
    `

    let musicplayer = document.getElementById('html5-musicplayer');
    musicplayer.innerHTML = html; //将代码挂载到DOM上

    let songSrc = musicplayer.getAttribute('song-src');
    let songAuthor = musicplayer.getAttribute('song-author');
    let songTitle = musicplayer.getAttribute('song-title');
    let songAvatar = musicplayer.getAttribute('song-avatar');
    let songLrc = musicplayer.getAttribute('song-lrc');

    SONGLRC = getFormatLrc(songLrc); //get song lrc

    document.getElementsByClassName('avatar')[0].setAttribute("src", songAvatar);
    document.getElementById('music-real-audio').setAttribute("src", songSrc);
    document.getElementById('music-title').innerText = songTitle;
    document.getElementById('music-author').innerText = songAuthor;

    let realplayer = document.getElementById('music-wrapper');
    let realplayerwidth = realplayer.clientWidth > 500 ? 510 : realplayer.clientWidth * 0.9 + 10;
    let realplayerheight = realplayer.clientHeight + 20;

    let playbg = document.getElementById('music-wrapper-bg');
    playbg.style.width = realplayerwidth + 'px';
    // playbg.style.height = realplayerheight + 'px';
    playbg.style.height = 100 + 'px';
    playbg.style.background = 'url(' + songAvatar + ') no-repeat center';
    playbg.style.backgroundSize = 'cover';
    playbg.style.backgroundPosition = 'center center';

    document.getElementById("music-info-wrapper").style.width = realplayerwidth - 120 + 'px'
    document.getElementById("progressBarBg").style.width = realplayerwidth - 120 + 'px'

    if (strlen(songTitle) > 14) {
        document.getElementById('music-title').style.animationPlayState = "running";
    }

    if (strlen(songAuthor) > 14) {
        document.getElementById('music-author').style.animationPlayState = "running";
    }
}


function getFormatLrc(lrc) {
    let reg = /\[\d+:\d+.\d+\]/g;
    let i = 0;
    let lrcwords = lrc.split(reg);
    let lrctime = lrc.match(reg);
    lrctime.unshift('[00:00.000]');
    let result = {};
    lrcwords.map((item, index) => {
        let index_m = lrctime[index].indexOf(':');
        let index_s = lrctime[index].indexOf('.');

        let result_key = parseInt(lrctime[index].slice(1, index_m)) * 60 + parseInt(lrctime[index].slice(index_m + 1, index_s)) + parseFloat(lrctime[index].slice(index_s + 1, lrctime[index].length - 1) / 1000) + '';
        item = item.replace('\\n', '');
        result[result_key] = item !== '' ? item : '······';
    })
    return result;
}

function setLrc(audio) {
    let currentTime = audio.currentTime;
    let realtime = '0';
    let i;
    for (i in SONGLRC) {
        if (parseFloat(i) < parseFloat(currentTime)) {
            if (parseFloat(realtime) < parseFloat(i))
                realtime = i;
        }
    }
    document.getElementById('music-lrc').innerText = SONGLRC[realtime];
}

function strlen(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        //单字节加1 
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        } else {
            len += 2;
        }
    }
    return len;
}