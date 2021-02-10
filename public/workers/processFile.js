

self.onmessage = async ($event) => {
    if ($event && $event.data && $event.data.msg === 'processFile') {
        const ret = await processFile($event.data.data, 
                                $event.data.maxLines, 
                                $event.data.stopWords, 
                                $event.data.maxLength, 
                                $event.data.noWordInLine, 
                                $event.data.vocalSize, 
                                $event.data.oovToken);
        self.postMessage(ret);
    }
};



/**
 * Process the file and store results in info
 *
 * @param data
 *
 * @return  Object with tokenizer, words, wordsTokenized and target
 * @see
 */

async function processFile(data, maxLines, stopWords, maxLength, noWordInLine, vocalSize, oovToken) {

    /**
     * Resize a array to a new size and put a default values in the new possitions 
     *
     * @param arr array to resize
     * @param newSize new size of the array
     * @param defaultValue value to put in the new positions  
     *
     * @return  new resized array 
     * @see
     */
    function resize(arr, newSize, defaultValue) {
        if (newSize > arr.length)
            return [...arr, ...Array(Math.max(newSize - arr.length, 0)).fill(defaultValue)];
        else {
            arr.length = newSize;
            return arr;
        }

    }


    // If the data has more lines that the maximum allowed 
    // the array is resized 
    if (data.length > maxLines) {
        data.length = maxLines;
    }

    // Get only the comment_text fild 
    let sentences = data.map((item) => {
        if (typeof item.comment_text === 'string' || item.comment_text instanceof String) {
            return item.comment_text;
        }
        else {
            return "";
        }
    });


    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after get the value of the column comment_text');

    // Change to lower case
    sentences = sentences.map((str) => { return str.toLowerCase() });

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after transform to lower case');

    
    // Remove stop words and other characters
    sentences = sentences.map((item) => {
        return item.replace("\n", " ")
            .replace("\\", " ")
            .replace("\b", " ")
            .replace("\f", " ")
            .replace("\r", " ")
            .replace("\t", " ")
            .replace("'s", " ")
            .replace("can't", " cannot ")
            .replace("-", " ")
            .replace("n't", " not ")
            .replace("'scuse", " excuse ")
            .replace(/[&/\\#,+=()$~%!|.":*?<>{}[\]\d]/ig, " ")
            
    });

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after replace special characters');

    sentences = sentences.map((item) => {
        return stopWords.reduce((acc, stopWord) => {
            const regex = new RegExp("^\\s*" + stopWord + "\\s*$" +
                                        "|^\\s*" + stopWord + "\\s+" +
                                        "|\\s+" + stopWord + "\\s*$" +
                                        "|\\s+" + stopWord + "\\s+", "ig");
                                        
            
            return acc.replace(regex, " ");
        }, item).replace(/\s+/g, " ")
                .trim();
    });

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after remove stop words');

    // Convert sentences to words
    const words = sentences.map((item) => { return resize(item.split(" "), maxLength, noWordInLine) });


    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after convert sentences to words');

    // Create array with all words and id as token and add "noWordInLine"

    let tokenizer = words.flat();

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after create array with all words to create tokens');
    
    tokenizer = tokenizer.reduce((acc, el) => { 
        const x = acc.find(obj => obj.word === el); 
        if (x){ 
            x.ct = x.ct + 1;
            } 
            else{
                acc.push({ct: 1, word: el})
            } 
            return acc;
        }, [{ ct: vocalSize*100+1, word: noWordInLine }, 
            { ct: vocalSize*100, word: oovToken }]);
    
    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after remove duplicates in the tokens array');
                
    tokenizer = tokenizer.sort((a,b) =>{return b.ct - a.ct;});

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after sort the token array');

    tokenizer = tokenizer.map((el, ind) => {return { ct: el.ct, token: ind, word: el.word }});

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after create token of each word in tokens array');

    // Resize the array to has a maximum size "vocalSize"
    if (tokenizer.length > vocalSize) {
        tokenizer.length = vocalSize;
    }

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after resize the tokens array');

    // Convert works to respective token
    const wordsTokenized = words.map(
        (sent) => {
            return sent.map(
                (item) => {
                    const retItem = tokenizer.find((i) => { return i.word === item; });
                    return (retItem ? retItem.token : 1);
                })
        });

    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after convert all words to respective token');


    // Get the lables and create a training output vector
    const target = data.map((item) => {
        return [item.identity_hate,
        item.insult,
        item.obscene,
        item.severe_toxic,
        item.threat,
        item.toxic];
    });

    //console.log(target);

    const target2 = data.map((item) => {
        var ret = [];

        for (var key in item) {
            if (key !== 'comment_text' && key !== 'id'  && item.hasOwnProperty(key)) {
                //console.log(key);
                ret.push(item[key]);
            }
        }

        return ret;
    });

    //console.log(target2);

    var targetLabels = [];

    for (var key in data[0]) {
        if (key !== 'comment_text' && key !== 'id'  && data[0].hasOwnProperty(key)) {
            targetLabels.push(key);
        }
    }

    //console.log(targetLabels);


    console.log('[' + new Date().toISOString().slice(11,-5) + ']: ', 'after create the labels vector for training');


    return {tokenizer: tokenizer, 
            words: words, 
            dataTokenized: wordsTokenized, 
            target: target,
            targetLabels: targetLabels}
}