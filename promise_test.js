
const createPromise = (data) =>
    new Promise((resolve, rejectd) => {

        setTimeout(() => {
            resolve(data)
        }, 3000);

    });


const p = createPromise('promise');
p.then((data) => {
    console.log(data);
    return data;
    createPromise(data + '2');
}).then((data) => {
    console.log(data)
}).catch((err) => {
    console.error(err)
})