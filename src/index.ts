var square = (x) => x * x;
module ClassSolutions {
	export class Person {
		Name: string;

		constructor(name: string) {
			this.Name = name;
		}

		public Hello() {
			return "Hello, " + this.Name;
		}
	}
}

var Araujo = new ClassSolutions.Person('Lucas Araujo');
console.log(Araujo.Hello());