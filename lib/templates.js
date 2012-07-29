(function(){ window.JST || (window.JST = {}) 
window.JST["game_menu/main_menu"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<h1>Main Menu</h1>\n<div class="left">\n  <h2>Build Menu</h2>\n</div>\n';
}
return __p;
};

window.JST["game_menu/turret_menu"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<h1>Turret Menu</h1>\n<div class="left">\n  <h2>Missile Turret</h2>\n</div>\n<div class="right">\n  <h2>Mass Driver Turret</h2>\n</div>\n';
}
return __p;
};

window.JST["game_over"] = function(obj){
var __p='';var print=function(){__p+=Array.prototype.join.call(arguments, '')};
with(obj||{}){
__p+='<h1>Game Over</h1>\nPress Space to play again\n';
}
return __p;
};

})();