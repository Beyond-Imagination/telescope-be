export function getDaysBefore(daysBefore: number): Date {
    const date = new Date()
    date.setDate(date.getDate() - daysBefore)
    return date
}

// getfMonthsBefore라는 함수는 만들수 없는데 이유는 아래와 같다
// 5월 31일에서 3개월 전을 구하면 2월이 반환될것으로 기대하는데
// 단순히 월을 빼면 5월 31일에서 3개월 전은 2월 31일이 되어버린다
// 하지만 이경우 2월이 아닌 3월 3일이 되어버리는 이슈가 있다
// 따라서 이 함수는 일자까지 확인하는 용도가 아닌 단순히 월만 사용하는 용도로 쓰고
// 위 이슈를 해결하기위해 안전하게 N달전 1일을 반환하는 함수를 만들었다
export function getStartOfMonthsBefore(monthsBefore: number): Date {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - monthsBefore)
    return date
}
