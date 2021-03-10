package ru.itmo.scn.fs

import kotlin.math.sqrt

fun List<Double>.sd(): Double {
    val mean = this.average()
    val squareSum = this.map { it - mean }.
            map { it * it }.
            sum()
    return sqrt(squareSum / (this.size - 1))
}

fun FloatArray.sd(): Double {
    val mean = this.average()
    val squareSum = this.map { it - mean }.
        map { it * it }.
        sum()
    return sqrt(squareSum / (this.size - 1))
}

fun FloatArray.scale(): FloatArray {
    val av = this.average()
    val sd = this.sd()
    val res = FloatArray(this.size)
    for (i in this.indices) {
        res[i] = ((this[i] - av) / sd).toFloat()
    }
    return res
}

fun FloatArray.add(b: FloatArray): FloatArray {
    if (this.size != b.size) {
        throw IllegalArgumentException("Arrays are of incompatible size: ${this.size} and ${b.size}")
    }
    val ans = FloatArray(this.size)
    for (i in this.indices) {
        ans[i] = this[i] + b[i]
    }
    return ans
}

operator fun FloatArray.div(b: Float): FloatArray {
    if (b == 0F) {
        throw IllegalArgumentException("Division by zero")
    }
    val ans = FloatArray(this.size)
    for (i in this.indices) {
        ans[i] = this[i] / b
    }
    return ans
}