"use strict"

// это не ошибка, просто надо доабвить include в stylelint
// в билде появится одни файл, который будет создан на базе этих двух. В консоль будет выведено 2 значения
const calculon = function(first, second) {
    const sum = first+second
    console.log(sum)
}
calculon(2,17)
calculon(10,1)
calculon("Я", " подключился")