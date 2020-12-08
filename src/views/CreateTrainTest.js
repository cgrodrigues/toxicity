import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import React, { useState } from "react";
import * as Papa from "papaparse";
import {
    Card,
    Container,
    Row,
    Col,
    CardBody,
    CardHeader,
    Table,
    FormGroup,
    Button,
    CardSubtitle,
    CardDeck,
    CardText,
    Input,
    ListGroup,
    ListGroupItem,
    Badge
} from "reactstrap";


const CreateTrainTest = (props) => {

    const maxLength = 40; // Maximum number of words in a sentences, it's the same as the input of the model

    const noWordInLine = "NWIL"; // In sentences with less of "maxLength" words the remaining positions will be filled with this.

    const vocalSize = 3000; // Maximum number of words used by tokenization, not all words in setences will be hear. 
    // If any word in the setence is not hear the return will be the token for "noWordInLine"   

    const maxLines = 20000; //Maximum lines to process from the file

    // list of stop words to remove of teh text
    const stopWords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "it", "it's", "its", "itself", "let's", "me", "more", "most", "my", "myself", "nor", "of", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "she'd", "she'll", "she's", "should", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "we'd", "we'll", "we're", "we've", "were", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "would", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];


    // Information that we want to maintain 
    const [info, setInfo] = useState({
        fileCsv: undefined, // Loaded file with the training data
        data: undefined, // array with sentances x words used for training. Each element is a word. Each line is a sentance. 
        dataTokenized: undefined,  // data Tokenized
        target: undefined, // all the lables of the training data
        tokenizer: undefined, // all words and tokens
        model: undefined, // the prediction model
        trained: false, // The model is already trained and ready for use
        classifyText: '', // Text to classify as test
        result: {toxic: undefined, severe_toxic: undefined,  obscene: undefined, threat: undefined, insult: undefined, identity_hate:undefined}
    });


    /**
     * Get the data from the file and call function to precess it.
     *
     * @param file
     * @param delimiter
     *
     * @return  nothing
     * @see
     */
    async function getData(file, delimiter) {
        Papa.parse(file, {
            delimiter: delimiter,
            worker: true,
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function (results) {
                console.log("Finished:", results.data);
                processFile(results.data);
            }
        });
    }


    /**
     * Process the file and store results in info
     *
     * @param data
     *
     * @return  nothing
     * @see
     */

    async function processFile(data) {

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
            return stopWords.reduce((acc, stopWord) => {
                const regex = new RegExp("^\\s*" + stopWord + "\\s*$|^\\s*" + stopWord + "\\s+|\\s+" + stopWord + "\\s*$|\\s+" + stopWord + "\\s+", "ig");
                return acc.replace(regex, " ");
            }, item)
                .replace("\n", " ")
                .replace("\\", " ")
                .replace("\b", " ")
                .replace("\f", " ")
                .replace("\r", " ")
                .replace("\t", " ")
                .replace("'s", " ")
                .replace("can't", "cannot ")
                .replace("-", " ")
                .replace("n't", " not ")
                .replace("'scuse", " excuse ")
                .replace(/[&/\\#,+=()$~%!|.'":*?<>{}[\]\d]/ig, " ")
                .replace(/\s+/g, " ")
                .trim();
        });

        // Convert sentences to words
        const words = sentences.map((item) => { return resize(item.split(" "), maxLength, noWordInLine) });


        // Create array with all words and id as token and add "noWordInLine"
        let tokenizer = words.flat().reduce((acc, el, idx) => { 
            const x = acc.find(obj => obj.word === el); 
            if (x){ 
                x.ct = x.ct + 1;
             } 
             else{
                 acc.push({ct: 1, word: el})
             } 
             return acc;
         }, [{ ct: vocalSize, token: -1, word: noWordInLine }]).sort((a,b) =>{return b.ct - a.ct;})
         .map((el, ind) => {return { ct: el.ct, token: ind, word: el.word }});

        /*
        let tokenizer = words.flat().filter(
            (item, pos, self) => {
                return self.indexOf(item) === pos;
            }).reduce(
                (acc, el, i) => {
                    return [...acc, { token: i + 1, word: el }]
                },
                []);
        */

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
                        return (retItem ? retItem.token : 0);
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

        // Store all information in "info" variable. 
        setInfo({ ...info, tokenizer: tokenizer, data: words, dataTokenized: wordsTokenized, target: target });

        alert("File processing concluded!!");
    }

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

    /**
     * Function to create the model that will be used 
     * Has 5 layers:
     *   Embedding
     *   Conv1D
     *   MaxPooling1D
     *   LSTM
     *   Dense
     *
     * @return  nothing 
     * @see
     */
    function createModel() {
        const embedingDim = 32;

        // Create a sequential model
        const model = tf.sequential();

        // Create a embedding layer 
        // tf.keras.layers.Embedding(vocab_size, embeding_dim, input_length= max_length ),
        model.add(tf.layers.embedding({ inputDim: vocalSize, outputDim: embedingDim, inputLength: maxLength }));

        // Create a Conv1D layer 
        // tf.keras.layers.Conv1D(64, 5, activation='relu'),
        model.add(tf.layers.conv1d({ filters: 64, kernelSize: 5, activation: 'relu' }));

        // Create a MaxPooling1D layer 
        //tf.keras.layers.MaxPooling1D(pool_size=4),
        model.add(tf.layers.maxPooling1d({ poolSize: 4 }));

        // Create a LSTM layer 
        // tf.keras.layers.LSTM(64),
        model.add(tf.layers.lstm({ units: 64 }));

        // Create a Dense layer 
        // tf.keras.layers.Dense(6, activation='sigmoid')
        model.add(tf.layers.dense({ units: 6, activation: "sigmoid" }));


        // Compile the model
        model.compile({ loss: 'binaryCrossentropy', optimizer: tf.train.adam(), metrics: ['accuracy'] });

        let modelInfo = "";

        //const printFn  = (message) => {modelInfo = modelInfo + message}

        //model.summary(undefined,[],printFn);
        var surface = document.getElementById('ModelInfo');
        tfvis.show.modelSummary(surface, model);


        // Store the model in the "info"

        setInfo({ ...info, model: model, modelInfo: modelInfo });
    }

    /**
     * Function to train the model 
     *
     * @return  nothing 
     * @see
     */
    function trainModel() {

        // Convert the input and label data to Tensors
        console.log(info.dataTokenized);
        const inputTensor = tf.tensor2d(info.dataTokenized, [info.dataTokenized.length, maxLength]);
        inputTensor.print();
        const labelTensor = tf.tensor2d(info.target, [info.target.length, 6]);

        // Variables to store the training history
        const historyEpoch = [];
        const historyBatch = [];

        const surface1 = document.getElementById('BatchGraph');
        const surface2 = document.getElementById('EpochGraph');

        // Callbacks functions to use during the training
        const cBack = [
            tf.callbacks.earlyStopping({monitor: 'val_acc'}), 
            new tf.CustomCallback({onBatchEnd: (batch, log) => {
                //console.log(batch);
                //console.log(log);
                historyBatch.push(log);
                //console.log(historyBatch);
                tfvis.show.history(surface1, historyBatch, ['loss', 'acc'], { height: 200});
            }}),
            new tf.CustomCallback({onEpochEnd: (epoch, log) => {
                //console.log(epoch);
                //console.log(log);

                historyEpoch.push(log);
                //console.log(historyEpoch);
                tfvis.show.history(surface2, historyEpoch, ['loss', 'val_loss', 'acc', 'val_acc'], { height: 200});
            }}),
            new tf.CustomCallback({onTrainBegin: (logs) => {
                //console.log('onTrainBegin:' );
                //console.log(logs);
            }}),
            new tf.CustomCallback({onTrainEnd: (logs) => {
                //console.log('onTrainEnd:' );
                //console.log(logs);
                setInfo({...info, trained: true});
                alert("Trainning concluded!!");
            }})
        ];

        // Train the model
        info.model.fit(inputTensor, labelTensor, {
            batchSize: 32,
            epochs: 4,
            shuffle: true,
            callbacks: cBack,
            validationSplit: 0.15
        });

        
    }

    /**
     * Function to classify a new value 
     *
     * @return  nothing 
     * @see
     */
    async function classify(){

        //Transform data

        // Change to lower case
        let sentence = info.classifyText.toLowerCase();

        console.log(sentence);
        // Remove stop words and other characters
        sentence = stopWords.reduce((acc, stopWord) => {
                                    const regex = new RegExp("^\\s*" + stopWord + "\\s*$" + 
                                                             "|^\\s*" + stopWord + "\\s+" +
                                                             "|\\s+" + stopWord + "\\s*$" +
                                                             "|\\s+" + stopWord + "\\s+", "ig");
                                    return acc.replace(regex, " ");
            }, sentence)
            .replace("\n", " ")
            .replace("\\", " ")
            .replace("\b", " ")
            .replace("\f", " ")
            .replace("\r", " ")
            .replace("\t", " ")
            .replace("'s", " ")
            .replace("can't", "cannot ")
            .replace("-", " ")
            .replace("n't", " not ")
            .replace("'scuse", " excuse ")
            .replace(/[&/\\#,+=()$~%!|.'":*?<>{}[\]\d]/ig, " ")
            .replace(/\s+/g, " ")
            .trim();

        // Convert sentence to words
        const input = resize(sentence.split(" "), maxLength, noWordInLine);

        console.log(input);

        console.log(info.tokenizer);
        
        // Convert works to respective token
        const inputTokenized =  input.map( (item) => {
                        const retItem = info.tokenizer.find((i) => { return i.word === item; });
                        return (retItem ? retItem.token : -1);
                    });

        console.log(inputTokenized);

        const inputTensor = tf.tensor2d(inputTokenized, [1, inputTokenized.length]);

        inputTensor.print();

        const result =  info.model.predict(inputTensor);

        result.print();
        console.log(result.print());

        const targetValue = await result.data();

        console.log(targetValue);

        setInfo({...info, result: {
                            toxic: targetValue?showPercentage(targetValue[0]):undefined, 
                            severe_toxic: targetValue?showPercentage(targetValue[1]):undefined,  
                            obscene: targetValue?showPercentage(targetValue[2]):undefined, 
                            threat: targetValue?showPercentage(targetValue[3]):undefined, 
                            insult: targetValue?showPercentage(targetValue[4]):undefined, 
                            identity_hate: targetValue?showPercentage(targetValue[5]):undefined
                        }
        });

        
    }

    /**
     * get a number between 0 and 1 and return and string with percentage 
     *
     * @return  nothing 
     * @see
     */
    function showPercentage(num){
        return (num*100).toFixed(2) + " %";
    }
    

    /**
     * Function called by the file loader buttom  
     *
     * @return  nothing 
     * @see
     */
    function handleLoadFile() {
        getData(info.fileCsv, ',');
    }

    /**
     * Function called by the file loader component  
     *
     * @return  nothing 
     * @see
     */
    function handleFileChange(event) {
        setInfo({ ...info, fileCsv: event.target.files[0] });
        console.log(event.target.files[0]);
    }


    /**
     * Function called by the textbox with teh text to classify  
     *
     * @return  nothing 
     * @see
     */
    function handleTextChange(event) {
        setInfo({ ...info, classifyText: event.target.value} )
    }



    //Print into table
    let printTable5Lines = (arr) => arr&&arr.slice(0, 5).map((sentence, id) => {
        const ret = sentence.map((word, i) => { return <td key={i}>{word}</td> }, '');
        return <tr key={id}><th scope="row">{id}</th>{ret}</tr>;
    });

    return (

        <Container className="pt-2" fluid>
            <Row className="mt-1 mt-md--8">
                <Col className="mb-5 mb-xl-0">
                    <Card className="shadow">
                        <CardHeader className="border-0">
                            <Row className="align-items-center">
                                <div className="col">
                                    <h5 className="pb-1"><i className="fas fa-biohazard"></i> Toxicity - Create, Train and Test Model</h5>
                                </div>
                                <div className="col text-right">
                                </div>
                            </Row>
                        </CardHeader>
                        <CardBody style={{ overflow: "scroll" }}>
                            <CardDeck>
                                <Card>
                                    <CardHeader><i className="fas fa-upload"></i> 1 - Load & Process Data</CardHeader>
                                    <CardBody>
                                        <CardSubtitle className="mb-2 text-muted">Load data from file and transform in tensors to use in a prediction model training and validation.</CardSubtitle>
                                        <CardText>
                                            <Col>
                                                <Row>
                                                    <Col>
                                                        <FormGroup>

                                                            <div className="custom-file">
                                                                <input type="file" className="custom-file-input" name="file" id="file" onChange={handleFileChange} />
                                                                <label className="custom-file-label" htmlFor="inputGroupFile01">{info.fileCsv ? info.fileCsv.name : 'Choose file'}</label>
                                                            </div>
                                                        </FormGroup>
                                                    </Col>
                                                    <Col>
                                                        <FormGroup>
                                                            <Button className="btn-icon"
                                                                color="primary"
                                                                type="button"
                                                                onClick={() => handleLoadFile()}>
                                                                <span className="btn-inner--icon mr-0">
                                                                    <i className="fas fa-binoculars"></i>
                                                                </span>
                                                                <span className="btn-inner--text d-none d-lg-inline"> Load File</span>

                                                            </Button>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Table responsive size="sm"><tbody>{printTable5Lines(info.data)}</tbody></Table>
                                                    <Table responsive size="sm"><tbody>{printTable5Lines(info.dataTokenized)}</tbody></Table>
                                                </Row>
                                            </Col>
                                        </CardText>
                                    </CardBody>
                                </Card>
                                <div>
                                    <Card>
                                        <CardHeader><i className="fab fa-buromobelexperte"></i> 2 - Create a Prediction Model</CardHeader>
                                        <CardBody>
                                            <CardSubtitle className="mb-2 text-muted">Create a sequencial prediction model with five layers.</CardSubtitle>
                                            <CardText>

                                                <Col>
                                                    <Row>
                                                        <FormGroup>
                                                            <Button disabled={!info.dataTokenized}
                                                                className="btn-icon"
                                                                color="primary"
                                                                type="button"
                                                                onClick={() => createModel()}>
                                                                <span className="btn-inner--icon mr-0">
                                                                    <i className="fas fa-plus-circle"></i>
                                                                </span>
                                                                <span className="btn-inner--text d-none d-lg-inline"> Create Model</span>
                                                            </Button>
                                                        </FormGroup>
                                                    </Row>
                                                    <Row>
                                                        <div id="ModelInfo" name="ModelInfo"></div>
                                                    </Row>
                                                </Col>
                                            </CardText>
                                        </CardBody>
                                    </Card>
                                    <div>&nbsp;</div>
                                    <Card>
                                    <CardHeader><i className="fas fa-plane-departure"></i> 3 - Start to Train Model</CardHeader>
                                    <CardBody>
                                        <CardSubtitle className="mb-2 text-muted">Train the created model with the loaded training data.</CardSubtitle>
                                        <CardText>
                                            <Col>
                                                <Row>
                                                    <FormGroup>
                                                        <Button disabled={!info.model}
                                                            className="btn-icon"
                                                            color="primary"
                                                            type="button"
                                                            onClick={() => trainModel()}>
                                                            <span className="btn-inner--icon mr-0">
                                                                <i className="fas fa-dumbbell"></i>
                                                            </span>
                                                            <span className="btn-inner--text d-none d-lg-inline"> Train Model</span>
                                                        </Button>
                                                    </FormGroup>
                                                </Row>
                                                <Row>
                                                    <div id="BatchGraph"></div>
                                                    <br></br>
                                                    <div id="EpochGraph"></div>
                                                </Row>
                                            </Col>
                                        </CardText>
                                    </CardBody>
                                </Card>
                                </div>
                                <Card>
                                    <CardHeader><i className="fas fa-stethoscope"></i> 4 - Test the Model</CardHeader>
                                    <CardBody>
                                        <CardSubtitle className="mb-2 text-muted">Last step is test the model with new data.</CardSubtitle>
                                        <CardText>
                                            <Row>
                                                <Col>
                                                    <Input 
                                                        className="text-toxicity"
                                                        id="text-toxicity"
                                                        placeholder="Text to classify"
                                                        rows="4"
                                                        type="textarea"
                                                        onChange={handleTextChange} />
                                                </Col>
                                            </Row>
                                            </CardText>
                                            <CardText>
                                            <Row>
                                                <Col>
                                                    <Button disabled={!info.trained}
                                                            className="btn-icon"
                                                            color="primary"
                                                            type="button"
                                                            onClick={() => classify() }>
                                                        <span className="btn-inner--icon mr-0">
                                                            <i className="fas fa-vial"></i>
                                                        </span>
                                                        <span className="btn-inner--text d-none d-lg-inline"> Classify</span>

                                                    </Button>
                                                </Col>
                                            </Row>
                                            </CardText>
                                            <CardText>
                                            <Row>
                                                <Col sm="12" md={{ size: 8, offset: 2 }}>
                                                    <ListGroup>
                                                        <ListGroupItem className="justify-content-between">Toxic <Badge pill>{info.result&&info.result.toxic}</Badge></ListGroupItem>
                                                        <ListGroupItem className="justify-content-between">Severe Toxic <Badge pill>{info.result&&info.result.severe_toxic}</Badge></ListGroupItem>
                                                        <ListGroupItem className="justify-content-between">Obscene <Badge pill>{info.result&&info.result.obscene}</Badge></ListGroupItem>
                                                        <ListGroupItem className="justify-content-between">Threat <Badge pill>{info.result&&info.result.threat}</Badge></ListGroupItem>
                                                        <ListGroupItem className="justify-content-between">Insult <Badge pill>{info.result&&info.result.insult}</Badge></ListGroupItem>
                                                        <ListGroupItem className="justify-content-between">Identity Hate <Badge pill>{info.result&&info.result.identity_hate}</Badge></ListGroupItem>
                                                    </ListGroup>
                                                </Col>
                                            </Row>

                                        </CardText>
                                    </CardBody>
                                </Card>
                            </CardDeck>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

}

export default CreateTrainTest;
