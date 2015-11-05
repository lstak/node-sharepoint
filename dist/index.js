var square = function (x) { return x * x; };
var ClassSolutions;
(function (ClassSolutions) {
    var Person = (function () {
        function Person(name) {
            this.Name = name;
        }
        Person.prototype.Hello = function () {
            return "Hello, " + this.Name;
        };
        return Person;
    })();
    ClassSolutions.Person = Person;
})(ClassSolutions || (ClassSolutions = {}));
var Araujo = new ClassSolutions.Person('Lucas Araujo');
console.log(Araujo.Hello());
