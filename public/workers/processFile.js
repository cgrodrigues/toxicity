

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

    // Change to lower case
    sentences = sentences.map((str) => { return str.toLowerCase() });

    
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

    console.log(sentences);

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

    console.log(sentences);

    // Convert sentences to words
    const words = sentences.map((item) => { return resize(item.split(" "), maxLength, noWordInLine) });


    console.log(words);

    // Create array with all words and id as token and add "noWordInLine"

    let tokenizer = words.flat();

    console.log('after flat');
    
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
    
    console.log('after reduce');
                
    tokenizer = tokenizer.sort((a,b) =>{return b.ct - a.ct;});

    console.log('after sort');

    tokenizer = tokenizer.map((el, ind) => {return { ct: el.ct, token: ind, word: el.word }});

    console.log('after map');

    // Resize the array to has a maximum size "vocalSize"
    if (tokenizer.length > vocalSize) {
        tokenizer.length = vocalSize;
    }

    // Convert works to respective token
    const wordsTokenized = words.map(
        (sent) => {
            return sent.map(
                (item) => {
                    const retItem = tokenizer.find((i) => { return i.word === item; });
                    return (retItem ? retItem.token : 1);
                })
        });


    // Get the lables and create a training output vector
    const target = data.map((item) => {
        return [item.identity_hate,
        item.insult,
        item.obscene,
        item.severe_toxic,
        item.threat,
        item.toxic];
    });


    return {tokenizer: tokenizer, 
            words: words, 
            dataTokenized: wordsTokenized, 
            target: target}
}