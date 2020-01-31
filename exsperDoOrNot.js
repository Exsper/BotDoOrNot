'use strict';

function ReplyObject(ask) {
    this.reply = true;
    this.ask = ask
    this.format = function() {
        if (this.choices.length > 0)
            return this.choices[Math.floor(Math.random() * this.choices.length)];
        else return undefined;
    }
}
ReplyObject.prototype.choices = function(choices) {
    this.choices = choices;
    return this;
}
ReplyObject.prototype.format = function(format) {
    this.format = format;
    return this;
}
ReplyObject.prototype.toString = function() {
    if (typeof this.format == 'function') {
        return this.format();
    } else {
        //default action: return undefined
        return undefined;
    }
}
ReplyObject.prototype.no = function() {
    this.reply = false;
    return this;
}
/**
 * 寻找s1的末尾和s2的开头的重复部分
 * @param {string} s1 字符串aaabb
 * @param {string} s2 字符串bbccc
 * @return {int} 重复部分在s1的起始点 
 */
function LookForTheSame(s1, s2) {
    let s1length = s1.length;
    let s2length = s2.length;

    if (s1length <= 0 || s2length <= 0) return -1;

    // 寻找重复部分
    let length = s1length > s2length ? s2length : s1length;
    while (length > 0) {
        let s1end = s1.substring(s1length - length);
        let s2start = s2.substring(0, length);
        if (s1end === s2start) return s1length - length;
        length -= 1;
    }
    return -1;
}


/**
 * 根据含“不”的选择性询问生成对应回复
 * @param {string} s 接受的消息
 * @return {ReplyObject} 所有可选项
 */
function AorB(ask) {
    const reply = new ReplyObject(ask);

    let asklength = ask.length;

    // 获取所有“不”的位置
    const arrOr = ask.split("").map((word, index) => { if (word === '不') return index; }).filter(e => e !== undefined)


    // 删除头尾的“不”
    if (arrOr[0] === 0) arrOr = arrOr.slice(1);
    if (arrOr[arrOr.length - 1] === 0) arrOr.pop();


    // 分析所有按“不”拆分情况，找出“不”两边有相同字符串的情况
    let possible = arrOr.reduce((acc, or) => {
        const s1 = ask.substring(0, or);
        const s2 = ask.substring(or + 1, asklength);
        const start = LookForTheSame(s1, s2);
        if (start >= 0) {
            acc.not.push(or);
            acc.start.push(start);
            acc.length.push(or - start);
        }
        return acc;
    }, {
        not: [],
        start: [],
        length: [],
    });
    if (possible.not.length <= 0) return reply.no();


    // 极端情况： aaabbb不bbbccc不bbbcccddd
    // 一般取最长的那个，如果都一样长那就取最后一个好了
    const indexOfMax = possible.length.indexOf(Math.max(...possible.length));

    const doStart = possible.start[indexOfMax];
    const notIndex = possible.not[indexOfMax];
    const doLength = possible.length[indexOfMax];


    // 具体情况：
    // 今天晚上 [吃] 不 [吃] 饭 = 回答：[吃]饭/不[吃]饭
    // 今天晚上 [要] 不 [要] 吃饭 = 回答：[要]吃饭/不[要]吃饭
    // 今天晚上 [吃饭] 不 [吃饭] = 回答：[吃饭]/不[吃饭]
    const doString = ask.substring(doStart, notIndex);
    let endString = (notIndex + doLength + 1 < asklength) ? ask.substring(notIndex + doLength + 1) : "";


    // 细节处理
    // 重复词有“！”视为恶意代码，不作回应（没人会用"学!code不学!code"聊天吧）
    if (endString.includes("!") || endString.includes("！")) return reply.no();
    // 结束词包含疑问词/符号，取符号前的语句
    if (endString.length > 0) {
        const endStringRegex = /(.*?)(?=\?|？|!|！|,|，|\.|。|呢)+/;
        const matchResult = endString.match(endStringRegex);
        if (matchResult instanceof Array) {
            endString = matchResult[0];
        }
    }

    //输出
    let replyString = doString + endString;
    // 将“我”改成“你”，“你”改成“我”
    let replyStringFix = replyString.split("").map(char => (char == '我') ? '你' : (char == '你' ? '我' : char)).join("");

    reply.choices = [replyStringFix, `不${replyStringFix}`]
    return reply
}

function DidOrNot(ask) {
    const reply = new ReplyObject(ask);
    const singleWordAction = ["咬","吞","吐","吮","吸","啃","喝","吃","咀","嚼","噘","嘟","努","撇","看","望","瞥","视","盯","瞧","窥","瞄","眺","瞪","瞅","搀","抱","搂","扶","捉","擒","掐","推","拿","抽","撕","摘","拣","捡","打","播","击","捏","撒","按","弹","撞","提","扭","捶","持","揍","披","捣","搜","托","举","拖","擦","敲","挖","抛","掘","抬","插","扔","写","抄","抓","捧","掷","撑","摊","倒","摔","劈","画","搔","撬","挥","揽","挡","捺","抚","搡","拉","摸","拍","摇","剪","拎","拔","拧","拨","舞","握","攥","退","进","奔","跑","赶","趋","遁","逃","立","站","跨","踢","跳","走","蹬","窜","说","看","走","听","笑","拿","跑","吃","唱","喝","敲","坐","盯","踢","闻","摸","在","死","有","想","爱","恨","伯","是","为","乃","能","会","愿","肯","敢","要","配","上","下","进","出","回","开","过","起","来"]
    const action = ask.match(/(?<action>.+)了[嘛吗](\?)?/);
    console.log(action);
    if (action.groups.action.length == 2 && singleWordAction.includes(action.groups.action.slice(0,1))) reply.choices = [`${action.groups.action.slice(0,1)}了`,`没${action.groups.action.slice(0,1)}`];
    else if (action.groups.action.length == 2) reply.choices = [`${action.groups.action}了`,`没${action.groups.action}`];
    else reply.choices = [`${action.groups.action}了`,`没有`];
    return reply
}

function findBuilder() {
    this.finder = [{
            matcher: (s) => (s.includes("不") && !s.includes("不不") && s.length <= 30 && s.length > 4),
            builder: AorB
        },
        {
            matcher: (s) => s.match(/(.+)了[嘛吗](\?)?/),
            builder: DidOrNot
        }
    ];
}
findBuilder.prototype.returnBuilderIfMatched = function(s) {
    const match = this.finder.find(matcher => matcher.matcher(s))
    if (match !== undefined) {
        return match.builder;
    } else {
        return false;
    }
}
let readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let b = new findBuilder();
rl.on('line', function(line) {
    let ask = line;
    if (ask.substring(0, 1) === "!" || ask.substring(0, 1) === "！") {
        try {
            let str = ask.trim().substring(1);
            let replyString = b.returnBuilderIfMatched(str);
            console.log(replyString);
            if (replyString) {
                return console.log(replyString(str).toString());
            }
        } catch (ex) {
            console.log(ex);
        }
    }
});
// Koishi插件名
module.exports.name = 'exsperDoOrNot';

// 插件处理和输出
module.exports.apply = (ctx) => {
    ctx.middleware((meta, next) => {
        let ask = meta.message;
        if (ask.substring(0, 1) === "!" || ask.substring(0, 1) === "！") {
            try {
                let replyString = Reply(ask.trim().substring(1));
                if (!replyString.reply) return next();
                else return meta.$send(replyString.toString());
            } catch (ex) {
                console.log(ex);
                return next();
            }
        } else {
            return next();
        }
    });
};