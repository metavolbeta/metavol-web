export const getWH = () => {
const params = new URLSearchParams(window.location.search);
const w_str = params.get("w");
let w = Math.floor(Number(w_str));
const h_str = params.get("h");
let h = Math.floor(Number(h_str));

if (w<100 || w>1000){
    w = 500;
}
if (h<100 || h>1000){
    h = 500;
}

return [w,h];
}

export const getTileN = () => {
    const params = new URLSearchParams(window.location.search);
    const n_str = params.get("n");
    let n = Math.floor(Number(n_str));
    
    if (n<1 || n> 20){
        n = 4;
    }
    return n;
    }

    