(function(n){n.fn.jCarouselLite=function(t){return t=n.extend({btnPrev:null,btnNext:null,btnGo:null,mouseWheel:!1,auto:null,speed:200,easing:null,width:null,height:null,vertical:!1,circular:!0,visible:3,start:0,scroll:1,beforeStart:null,afterEnd:null},t||{}),this.each(function(){function y(){return f.slice(r).slice(0,i)}function h(f){if(!l){if(t.beforeStart&&t.beforeStart.call(this,y()),t.circular)f<=t.start-i-1?(u.css(c,-((e-i*2)*o)+"px"),r=f==t.start-i-1?e-i*2-1:e-i*2-t.scroll):f>=e-i+1?(u.css(c,-(i*o)+"px"),r=f==e-i+1?i+1:i+t.scroll):r=f;else{if(f<0||f>e-i)return;r=f}l=!0;u.animate(c=="left"?{left:-(r*o)}:{top:-(r*o)},t.speed,t.easing,function(){t.afterEnd&&t.afterEnd.call(this,y());l=!1});t.circular||(n(t.btnPrev+","+t.btnNext).removeClass("disabled"),n(r-t.scroll<0&&t.btnPrev||r+t.scroll>e-i&&t.btnNext||[]).addClass("disabled"))}return!1}var l=!1,c=t.vertical?"top":"left",v=t.vertical?"height":"width",s=n(this),u=n("ul",s),a=n("li",u),p=a.size(),i=t.visible;t.circular&&(u.prepend(a.slice(p-i-0).clone()).append(a.slice(0,i).clone()),t.start+=i);var f=n("li",u),e=f.size(),r=t.start;s.css("visibility","visible");f.css({overflow:"hidden",float:t.vertical?"none":"left"});u.css({margin:"0",padding:"0",position:"relative","list-style-type":"none","z-index":"1"});s.css({overflow:"hidden",position:"relative","z-index":"2",left:"0px"});var o=t.vertical?t.height!=null?t.height:f.height():t.width!=null?t.width:f.width(),w=o*e,b=o*i;f.css({width:t.width!=null?t.width+"px":f.width(),height:t.height!=null?t.height+"px":f.height()});u.css(v,w+"px").css(c,-(r*o));s.css(v,b+"px");t.btnPrev&&n(t.btnPrev).click(function(){return h(r-t.scroll)});t.btnNext&&n(t.btnNext).click(function(){return h(r+t.scroll)});t.btnGo&&n.each(t.btnGo,function(i,r){n(r).click(function(){return h(t.circular?t.visible+i:i)})});t.mouseWheel&&s.mousewheel&&s.mousewheel(function(n,i){return i>0?h(r-t.scroll):h(r+t.scroll)});t.auto&&setInterval(function(){h(r+t.scroll)},t.auto+t.speed)})}})(jQuery)