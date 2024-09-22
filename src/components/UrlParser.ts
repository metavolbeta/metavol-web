// getWH and getTileN library
// both are extracted from URL string
// for example
// ....?w=400&h=300&n=3
// modified on 2024/9/4
//

export const getWH = () => {
    const params = new URLSearchParams(window.location.search);
    const w_str = params.get("w");
    let w = Math.floor(Number(w_str));
    const h_str = params.get("h");
    let h = Math.floor(Number(h_str));

    // URLにwやhが存在しないときは、w=0, h=0になる。

    if (w<100 || w>1000){
        w = 300;
    }
    if (h<100 || h>1000){
        h = 300;
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
    