// CLUT library
// Kenji Hirata
// 2024/4/29
// hot added 2024/6/6
//

const generate = (csv: string) => {
    
    const ss = csv.split('\n');

    var tbl = new Array(ss.length);
    for(let y = 0; y < tbl.length; y++) {
      tbl[y] = new Array(3).fill(0);
    }

    for (let i =0; i<ss.length; i++){
        const rgb = ss[i].split(",");
        tbl[i][0] = Number(rgb[0]);
        tbl[i][1] = Number(rgb[1]);
        tbl[i][2] = Number(rgb[2]);
    }
    return tbl;
}


const rainbow_text = `0,0,0
0,0,0
0,0,0
0,0,1
0,0,1
0,0,2
0,0,4
0,0,6
0,0,9
0,0,13
0,0,18
0,0,24
0,0,32
0,0,41
0,0,50
0,0,61
0,0,71
0,0,82
0,0,91
0,0,100
0,0,108
0,1,115
0,1,120
0,1,125
0,2,128
0,3,131
0,4,134
0,6,137
0,8,139
0,10,142
0,13,144
0,15,147
0,18,150
0,20,152
0,23,155
0,25,157
0,27,159
0,29,161
0,31,162
0,33,163
0,35,164
0,37,164
0,39,164
0,42,165
0,45,165
0,48,165
0,52,165
0,56,165
0,59,165
0,63,165
0,67,165
0,70,165
0,73,165
0,76,165
0,78,165
0,81,165
0,83,164
0,85,164
0,87,164
0,89,163
0,92,163
0,94,162
0,98,162
0,101,161
0,104,160
0,107,159
0,110,159
0,113,158
0,116,157
0,118,157
0,120,156
0,122,155
0,123,154
0,125,153
0,127,152
0,129,150
0,131,148
0,133,146
0,136,143
0,138,141
0,141,138
0,143,136
0,146,133
0,148,131
0,150,129
0,152,127
0,153,125
0,155,124
0,156,122
0,157,121
0,158,119
0,159,117
0,160,115
0,161,113
0,162,110
0,164,108
0,165,105
0,167,102
0,168,100
0,169,97
0,170,95
0,172,93
0,173,91
0,174,88
0,176,85
0,178,82
0,180,78
0,183,74
0,187,68
0,191,62
0,195,56
0,199,49
0,204,41
0,208,34
0,212,28
1,216,22
2,219,17
3,222,12
4,224,9
7,225,6
10,226,4
14,226,3
20,226,2
27,225,1
36,224,1
46,222,0
57,221,0
68,219,0
80,217,0
92,215,0
102,214,0
112,212,0
121,211,0
129,210,0
135,209,0
140,209,0
145,209,0
149,210,0
152,211,0
155,212,0
159,214,0
163,216,0
166,219,0
170,221,0
174,224,0
178,226,0
182,229,0
185,231,0
189,233,0
191,235,0
194,236,0
196,237,0
199,238,0
201,238,0
204,238,0
207,239,0
211,239,0
215,239,0
219,239,0
224,239,0
228,239,0
233,239,0
237,239,0
241,239,0
244,239,0
247,238,0
248,238,0
250,237,0
250,236,0
250,235,0
250,233,0
248,231,0
247,229,0
245,226,0
242,223,0
240,220,0
237,216,0
235,213,0
232,210,0
230,207,0
228,204,1
226,202,1
225,200,2
224,198,3
223,196,4
223,193,6
223,191,8
222,188,10
222,185,13
222,182,16
222,178,19
222,174,22
222,171,25
222,167,28
222,163,31
222,160,33
222,157,35
222,154,36
222,151,36
222,149,36
223,147,36
223,145,36
223,142,35
223,139,33
224,136,31
224,133,28
225,129,25
226,125,22
226,122,19
227,118,16
227,114,13
228,110,10
228,107,8
229,104,6
229,102,4
229,99,3
229,97,2
227,94,1
228,91,1
227,87,0
226,83,0
225,79,0
224,74,0
223,69,0
221,63,0
220,58,0
219,53,0
218,49,0
217,45,0
217,41,0
217,38,0
217,36,0
217,34,0
218,32,0
220,30,0
222,28,0
224,25,0
227,23,0
230,21,0
233,18,0
236,15,0
239,13,0
242,10,0
245,8,0
247,6,0
249,4,0
251,3,0
252,2,0
253,1,0
254,1,0
254,1,0
255,0,0
255,0,0
255,0,0
255,0,0
255,0,0`

const hot_text  = `0,0,0
2,0,0
5,0,0
7,0,0
10,0,0
13,0,0
15,0,0
18,0,0
21,0,0
23,0,0
26,0,0
29,0,0
31,0,0
34,0,0
37,0,0
39,0,0
42,0,0
45,0,0
47,0,0
50,0,0
53,0,0
55,0,0
58,0,0
61,0,0
63,0,0
66,0,0
69,0,0
71,0,0
74,0,0
77,0,0
79,0,0
82,0,0
85,0,0
87,0,0
90,0,0
92,0,0
95,0,0
98,0,0
100,0,0
103,0,0
106,0,0
108,0,0
111,0,0
114,0,0
116,0,0
119,0,0
122,0,0
124,0,0
127,0,0
130,0,0
132,0,0
135,0,0
138,0,0
140,0,0
143,0,0
146,0,0
148,0,0
151,0,0
154,0,0
156,0,0
159,0,0
162,0,0
164,0,0
167,0,0
170,0,0
172,0,0
175,0,0
177,0,0
180,0,0
183,0,0
185,0,0
188,0,0
191,0,0
193,0,0
196,0,0
199,0,0
201,0,0
204,0,0
207,0,0
209,0,0
212,0,0
215,0,0
217,0,0
220,0,0
223,0,0
225,0,0
228,0,0
231,0,0
233,0,0
236,0,0
239,0,0
241,0,0
244,0,0
247,0,0
249,0,0
252,0,0
255,0,0
255,2,0
255,5,0
255,7,0
255,10,0
255,13,0
255,15,0
255,18,0
255,21,0
255,23,0
255,26,0
255,29,0
255,31,0
255,34,0
255,37,0
255,39,0
255,42,0
255,45,0
255,47,0
255,50,0
255,53,0
255,55,0
255,58,0
255,61,0
255,63,0
255,66,0
255,69,0
255,71,0
255,74,0
255,77,0
255,79,0
255,82,0
255,85,0
255,87,0
255,90,0
255,92,0
255,95,0
255,98,0
255,100,0
255,103,0
255,106,0
255,108,0
255,111,0
255,114,0
255,116,0
255,119,0
255,122,0
255,124,0
255,127,0
255,130,0
255,132,0
255,135,0
255,138,0
255,140,0
255,143,0
255,146,0
255,148,0
255,151,0
255,154,0
255,156,0
255,159,0
255,162,0
255,164,0
255,167,0
255,170,0
255,172,0
255,175,0
255,177,0
255,180,0
255,183,0
255,185,0
255,188,0
255,191,0
255,193,0
255,196,0
255,199,0
255,201,0
255,204,0
255,207,0
255,209,0
255,212,0
255,215,0
255,217,0
255,220,0
255,223,0
255,225,0
255,228,0
255,231,0
255,233,0
255,236,0
255,239,0
255,241,0
255,244,0
255,247,0
255,249,0
255,252,0
255,255,0
255,255,3
255,255,7
255,255,11
255,255,15
255,255,19
255,255,23
255,255,27
255,255,31
255,255,35
255,255,39
255,255,43
255,255,47
255,255,51
255,255,55
255,255,59
255,255,63
255,255,67
255,255,71
255,255,75
255,255,79
255,255,83
255,255,87
255,255,91
255,255,95
255,255,99
255,255,103
255,255,107
255,255,111
255,255,115
255,255,119
255,255,123
255,255,127
255,255,131
255,255,135
255,255,139
255,255,143
255,255,147
255,255,151
255,255,155
255,255,159
255,255,163
255,255,167
255,255,171
255,255,175
255,255,179
255,255,183
255,255,187
255,255,191
255,255,195
255,255,199
255,255,203
255,255,207
255,255,211
255,255,215
255,255,219
255,255,223
255,255,227
255,255,231
255,255,235
255,255,239
255,255,243
255,255,247
255,255,251`

const ge_text  = `0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,0
0,0,1
0,0,2
0,0,5
0,0,9
0,0,14
0,0,21
0,0,26
0,0,30
0,0,34
0,0,35
0,0,36
0,0,37
0,0,38
0,0,39
0,0,40
0,0,42
0,0,43
0,0,44
0,0,45
0,0,47
0,0,49
0,0,51
0,0,53
0,0,54
0,0,56
0,0,58
0,0,60
0,0,61
0,0,62
0,0,63
0,0,65
0,0,67
0,0,69
0,0,71
0,0,74
0,0,76
0,0,77
0,0,78
0,0,79
0,0,81
0,0,83
0,0,85
0,0,86
0,0,88
0,0,90
0,0,92
0,0,94
0,0,96
1,0,97
2,0,100
4,0,102
7,0,106
9,0,109
12,0,112
13,0,115
15,0,117
17,0,119
18,0,121
19,0,123
20,0,125
23,0,128
25,0,132
27,0,134
30,0,137
32,0,140
33,0,143
34,0,145
36,0,146
37,0,148
38,0,150
40,0,153
43,0,156
45,0,160
49,0,165
52,0,169
54,0,171
57,0,174
59,0,177
61,0,179
62,0,181
65,0,184
67,0,186
70,0,189
72,0,192
75,0,195
78,0,198
80,0,201
82,0,203
84,0,205
86,0,207
88,0,210
91,0,212
93,0,216
96,0,219
99,0,222
102,0,225
105,0,228
106,0,230
109,0,230
112,0,230
114,0,230
118,0,229
122,0,227
126,0,226
130,0,223
135,0,220
138,0,218
141,0,215
143,0,213
146,0,211
147,0,209
150,0,205
152,0,202
155,0,197
157,0,193
160,0,188
161,0,184
163,0,180
164,0,177
165,0,175
166,0,172
167,0,169
168,0,165
170,0,160
173,0,155
175,0,150
177,0,145
179,0,140
180,0,136
181,0,133
182,0,130
184,0,126
185,0,122
187,0,117
189,0,111
192,0,106
193,0,100
195,0,95
196,0,91
198,0,89
199,1,86
200,2,82
201,3,78
203,6,74
205,9,69
208,13,63
210,16,58
212,20,53
213,24,49
214,27,46
216,29,41
218,33,37
220,37,32
222,42,26
225,47,20
227,51,14
229,56,9
231,60,5
233,63,3
234,66,1
235,69,0
237,72,0
239,75,0
241,80,0
243,84,0
246,89,0
247,93,0
249,97,0
251,100,0
252,104,0
253,107,0
253,110,0
254,115,0
254,119,0
255,122,0
255,126,0
255,129,0
255,131,0
255,133,0
255,135,0
255,138,0
255,141,0
255,145,0
255,148,0
255,151,0
255,154,0
255,157,0
255,159,0
255,161,0
255,163,0
255,166,0
255,169,0
255,173,0
255,176,0
255,181,0
255,185,0
255,187,0
255,190,0
255,192,0
255,195,0
255,198,0
255,201,0
255,204,0
255,208,0
255,211,0
255,214,0
255,216,0
255,219,0
255,221,0
255,223,1
255,226,2
255,229,3
255,233,6
255,238,10
255,243,16
255,246,22
255,248,30
255,250,37
255,252,45
255,253,54
255,253,65
255,254,78
255,254,93
255,255,108
255,255,122
255,255,135
255,255,146
255,255,157
255,255,167
255,255,177
255,255,188
255,255,200
255,255,213
255,255,226
255,255,237`


const black2white = [...Array(256).keys()].map((d) => {return [d,d,d]});
const white2black =  [...Array(256).keys()].map((d) => {return [255-d,255-d,255-d]});

const rainbow = generate(rainbow_text);
const rainbow_r = rainbow.slice().reverse();
const hot = generate(hot_text);
const hot_r = hot.slice().reverse();
const ge = generate(ge_text);
const ge_r = ge.slice().reverse();

const getReversedName = (clut_name: string) => {
    if (clut_name == "black2white"){
        return "white2black";
    }
    if (clut_name == "white2black"){
        return "black2white";
    }
    if (clut_name.endsWith('_r')){
        return clut_name.substring(0, clut_name.length-2);
    }else{
        return clut_name+"_r";
    }
}

export const cluts = {
    black2white,
    white2black,
    rainbow,
    rainbow_r,
    hot,
    hot_r,
    ge,
    ge_r,
    getReversedName,
};
