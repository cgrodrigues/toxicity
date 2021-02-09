import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';
import React, { useState, useEffect } from "react";
import * as Papa from "papaparse";
//import { useWorker } from "@koale/useworker";
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
    Input,
    ListGroup,
    ListGroupItem,
    Badge,
    Spinner,
    UncontrolledTooltip
} from "reactstrap";






const CreateTrainTest = (props) => {

    const initMaxLength = 40; // Maximum number of words in a sentences, it's the same as the input of the model

    const noWordInLine = "NWIL"; // In sentences with less of "maxLength" words the remaining positions will be filled with this.

    const initVocalSize = 3000; // Maximum number of words used by tokenization, not all words in setences will be hear. 
                            // If any word in the setence is not hear the return will be the token for "oovToken"   

    const oovToken = "outofvocabulary";  // teh word is not in the words used for tokenization

    const maxLines = 200000; //Maximum lines to process from the file

    // list of stop words to remove of teh text
    const initialStopWords = ['a', 'about', 'above', 'after', 'again', 'against', 'ain', 'all', 'am', 'an', 'and', 'any', 'are', 'aren', "aren't", 'as', 'at', 'b', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'c', 'can', 'couldn', "couldn't", 'd', 'did', 'didn', "didn't", 'do', 'does', 'doesn', "doesn't", 'doing', 'don', "don't", 'down', 'during', 'e', 'each', 'f', 'few', 'for', 'from', 'further', 'g', 'h', 'had', 'hadn', "hadn't", 'has', 'hasn', "hasn't", 'have', 'haven', "haven't", 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', "isn't", 'it', "it's", 'its', 'itself', 'j', 'just', 'k', 'l', 'll', 'm', 'ma', 'me', 'mightn', "mightn't", 'more', 'most', 'mustn', "mustn't", 'my', 'myself', 'needn', "needn't", 'n', 'no', 'nor', 'not', 'now', 'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'p', 'q', 'r', 're', 's', 'same', 'shan', "shan't", 'she', "she's", 'should', "should've", 'shouldn', "shouldn't", 'so', 'some', 'such', 't', 'than', 'that', "that'll", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'u', 'under', 'until', 'up', 've', 'v', 'very', 'w', 'was', 'wasn', "wasn't", 'we', 'were', 'weren', "weren't", 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'won', "won't", 'wouldn', "wouldn't", 'y', 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours', 'yourself', 'yourselves', 'x','z'];    // Information that we want to maintain 

    const [progress, setProgress] = useState({stage: undefined, count:0})


    const [processing, setProcessing] = useState({file:false, 
                                                  modelCreation:false, 
                                                  training: false, 
                                                  classification: false});

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


    const [stopWords, setStopWords] = useState(initialStopWords);
    const [maxLength, setMaxLength] = useState(initMaxLength);
    const [vocalSize, setVocalSize] = useState(initVocalSize);

    
    //const [getProcessFileWorker] = useWorker(processFile);

    const processFileWorker: Worker = new Worker('/workers/processFile.js');

    
    useEffect(() => {
        processFileWorker.onmessage = ($event: MessageEvent) => {
            if ($event && $event.data) {
                //setCountApple($event.data);

                console.log($event.data);
                console.log("End.");

                alert("File processing concluded!!");

                // Store all information in "info" variable. 
                setInfo({ ...info, tokenizer: $event.data.tokenizer, 
                                    data: $event.data.words, 
                                    dataTokenized: $event.data.dataTokenized, 
                                    target: $event.data.target});

                // Set that finish teh file processing
                setProcessing({...processing, file: false})
            }
        };
    }, [processFileWorker]);



      /**
     * Function to call the file read and start the worker to process the data
     *
     * @param file
     * @param delimiter
     *
     * @return  nothing
     * @see
     */
    const runGetData = async (file, separator) => {
        
        //Open the file and read the information
        const data = await getData(file, separator)

        //Call teh worker to process teh data
        console.log("begin");
        //const processedData = await getProcessFileWorker(data, maxLines, stopWords, maxLength, noWordInLine, vocalSize, oovToken); 

        processFileWorker.postMessage({msg: 'processFile', 
                                       data: data, 
                                       maxLines: maxLines, 
                                       stopWords: stopWords, 
                                       maxLength: maxLength, 
                                       noWordInLine: noWordInLine, 
                                       vocalSize: vocalSize, 
                                       oovToken: oovToken});
        
      };

      /**
     * Get the data from the file and call function to precess it.
     *
     * @param file
     * @param delimiter
     *
     * @return  file data
     * @see
     */
    async function getData(file, delimiter) {
        const parseFile = async (file, delimiter) => {
            return new Promise(resolve => {
                Papa.parse(file, {
                    delimiter: delimiter,
                    worker: true,
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                    complete: results => {
                        console.log("Finished:", results.data);
                        resolve(results.data);
                    }
                });
            });
        };

        let data = await parseFile(file, delimiter);
        return data;
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
        const embedingDim = 32 //15;   //32;

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


        //model.summary(undefined,[],printFn);
        var surface = document.getElementById('ModelInfo');
        tfvis.show.modelSummary(surface, model);


        // Store the model in the "info"
        setInfo({ ...info, model: model});
    }

    /**
     * Function to train the model 
     *
     * @return  nothing 
     * @see
     */
    async function trainModel() {

        // Convert the input and label data to Tensors
        console.log(info);

        const inputTensor = tf.tensor2d(info.dataTokenized, [info.dataTokenized.length, maxLength]);
        inputTensor.print();
        const labelTensor = tf.tensor2d(info.target, [info.target.length, 6]);
        labelTensor.print();

        // Variables to store the training history
        const historyEpoch = [];
        //const historyBatch = [];

        //const surface1 = document.getElementById('BatchGraph');
        const surface2 = document.getElementById('EpochGraph');

        // Callbacks functions to use during the training
        const cBack = [
            tf.callbacks.earlyStopping({monitor: 'val_acc'}), 
            new tf.CustomCallback({onEpochEnd: (epoch, log) => {  
                console.log('onEpochEnd:' );
                historyEpoch.push(log);
                tfvis.show.history(surface2, historyEpoch, ['loss', 'val_loss', 'acc', 'val_acc'], { height: 200});
            }}),
            new tf.CustomCallback({onBatchEnd: (batch, log) => {  
                console.log('onBatchEnd' );
            }}),
            new tf.CustomCallback({onTrainBegin: (logs) => {
                console.log('onTrainBegin:' );
            }}),
            new tf.CustomCallback({onTrainEnd: (logs) => {
                console.log('onTrainEnd:' );
                setInfo({...info, trained: true});
                setProcessing({...processing, training: false})
                alert("Trainning concluded!!");
            }})
        ];

        // Train the model
        info.model.fit(inputTensor, labelTensor, {
            batchSize: 32, //500, //32,
            epochs: 5,
            shuffle: true,
            callbacks: cBack,
            validationSplit: 0.20
        });

        
    }

    /**
     * Function to classify a new value 
     *
     * @return  nothing 
     * @see
     */
    async function classify(){

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

        //Transform data

        // Change to lower case
        let sentence = info.classifyText.toLowerCase();

        sentence = sentence.replace("\n", " ")
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
                            .replace(/[&/\\#,+=()$~%!|.":*?<>{}[\]\d]/ig, " ")

        console.log(sentence);
        // Remove stop words and other characters
        sentence = stopWords.reduce((acc, stopWord) => {
                                    const regex = new RegExp("^\\s*" + stopWord + "\\s*$" + 
                                                             "|^\\s*" + stopWord + "\\s+" +
                                                             "|\\s+" + stopWord + "\\s*$" +
                                                             "|\\s+" + stopWord + "\\s+", "ig");
                                    return acc.replace(regex, " ");
            }, sentence)
            .replace(/\s+/g, " ")
            .trim();

        console.log(sentence);
        
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
                            identity_hate: targetValue?showPercentage(targetValue[0]):undefined, 
                            insult: targetValue?showPercentage(targetValue[1]):undefined,  
                            obscene: targetValue?showPercentage(targetValue[2]):undefined, 
                            severe_toxic: targetValue?showPercentage(targetValue[3]):undefined, 
                            threat: targetValue?showPercentage(targetValue[4]):undefined, 
                            toxic: targetValue?showPercentage(targetValue[5]):undefined
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
    async function handleLoadFile() {
        setProcessing({...processing, file: true})
        runGetData(info.fileCsv, ',');
    }

    /**
     * Function called by the training model buttom  
     *
     * @return  nothing 
     * @see
     */
    async function handleTrainingModel() {
        setProcessing({...processing, training: true} )
        trainModel();
    }

    /**
     * Function called by the create model buttom  
     *
     * @return  nothing 
     * @see
     */
    async function handleCreateModel() {
        createModel()
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

    
    /**
     * Function called by the text area with the stop words  
     *
     * @return  nothing 
     * @see
     */
    function handleStopWords(event) {
        console.log(event.target.value)
        setStopWords(event.target.value.split(','))
    }

    /**
     * Function called by the text with max number of words in a sentance
     *
     * @return  nothing 
     * @see
     */
    function handleMaxLength(event) {
        console.log(event.target.value)
        setMaxLength(event.target.value)
    }

    /**
     * Function called by the size of the array with the words to tokenize  
     *
     * @return  nothing 
     * @see
     */
    function handleVocalSize(event) {
        console.log(event.target.value)
        setVocalSize(event.target.value)
    }



    //Print header table
    const printTableHeader5Lines = (arr)  => {
        if (arr){
            const ret = arr[0].map( (w, i) => {return <th key={i}>{'w' + i}</th>});
            return <tr key={-1}><th scope="row">#</th>{ret}</tr>;
        }
        else{
            return undefined;  
        }
    };



    //Print into table
    const printTable5Lines = (arr) => arr&&arr.slice(0, 5).map((sentence, id) => {
        const ret = sentence.map((word, i) => { return <td key={i}>{word}</td> });
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
                                        <CardSubtitle className="mb-2 text-muted">Load data from file and transform in tensors to use in a prediction model training and validation.<p>Download training data <a href="/training-data/train.zip">here</a></p></CardSubtitle>
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
                                                                disabled={!info.fileCsv}
                                                                onClick={() => handleLoadFile()}>
                                                                <span className="btn-inner--icon mr-0">
                                                                    <i className="fas fa-upload"></i>
                                                                </span>
                                                                <span className="btn-inner--text d-none d-lg-inline"> 
                                                                {!processing.file ? " Load File" : " Loading.."}</span>
                                                                {processing.file ? (
                                                                    <Spinner
                                                                    style={{ width: "0.7rem", height: "0.7rem" }}
                                                                    type="grow"
                                                                    color="light"
                                                                    />
                                                                ):null}
                                                            </Button>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                    <FormGroup>
                                                    <label
                                                        className="form-control-label"
                                                        htmlFor="list-stop-words">
                                                        List stop words to remove
                                                        <i href="#"  id="list-stop-words-info-icon" className="fas fa-info-circle ml-1" />
                                                        <UncontrolledTooltip delay={0} placement="right" target="list-stop-words-info-icon">
                                                            ...
                                                        </UncontrolledTooltip>
                                                    </label>
                                                    <Input
                                                        id="list-stop-words"
                                                        name="list-stop-words"
                                                        placeholder="Stop words to remove"
                                                        rows="4"
                                                        maxLength="1200"
                                                        type="textarea"
                                                        value={stopWords}
                                                        onChange={e => handleStopWords(e)}/>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <FormGroup>
                                                            <label className="form-control-label" htmlFor="number-of-words-select">
                                                                Number of words in a sentences
                                                                <i href="#" id="number-of-words-info-icon" className="fas fa-info-circle ml-1" />
                                                                <UncontrolledTooltip delay={0} placement="right" target="number-of-words-info-icon">
                                                                    ...
                                                                </UncontrolledTooltip>
                                                            </label>

                                                            <Input id="number-of-words-select"
                                                                name="number-of-words-select"
                                                                min={10} max={40}
                                                                type="number"
                                                                step="1"
                                                                value={maxLength}
                                                                onChange={e => handleMaxLength(e)}/>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <FormGroup>
                                                            <label className="form-control-label" htmlFor="vocal-size">
                                                                Number of words used as token
                                                                <i href="#" id="vocal-size-icon" className="fas fa-info-circle ml-1" />
                                                                <UncontrolledTooltip delay={0} placement="right" target="vocal-size-icon">
                                                                    ...
                                                                </UncontrolledTooltip>
                                                            </label>

                                                            <Input id="vocal-size"
                                                                name="vocal-size"
                                                                min={10} max={40}
                                                                type="number"
                                                                step="1"
                                                                value={vocalSize}
                                                                onChange={e => handleVocalSize(e)}/>
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                                {progress?<Row>{progress.stage}: {progress.count}</Row>:<></>}
                                                <Row>
                                                    <Table striped responsive size="sm"><thead>{printTableHeader5Lines(info.data)}</thead><tbody>{printTable5Lines(info.data)}</tbody></Table>
                                                    <Table striped responsive size="sm"><thead>{printTableHeader5Lines(info.dataTokenized)}</thead><tbody>{printTable5Lines(info.dataTokenized)}</tbody></Table>
                                                </Row>
                                            </Col>
                                    </CardBody>
                                </Card>
                                <div>   
                                    <Card>
                                        <CardHeader><i className="fab fa-buromobelexperte"></i> 2 - Create a Prediction Model</CardHeader>
                                        <CardBody>
                                            <CardSubtitle className="mb-2 text-muted">Create a sequencial prediction model with five layers.</CardSubtitle>
                                                <Col>
                                                    <Row>
                                                        <FormGroup>
                                                            <Button disabled={!info.dataTokenized}
                                                                className="btn-icon"
                                                                color="primary"
                                                                type="button"
                                                                onClick={() => handleCreateModel()}>
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
                                        </CardBody>
                                    </Card>
                                    <div>&nbsp;</div>
                                    <Card>
                                    <CardHeader><i className="fas fa-plane-departure"></i> 3 - Start to Train Model</CardHeader>
                                    <CardBody>
                                        <CardSubtitle className="mb-2 text-muted">Train the created model with the loaded training data.</CardSubtitle>
                                            <Col>
                                                <Row>
                                                    <FormGroup>
                                                        <Button disabled={!info.model}
                                                            className="btn-icon"
                                                            color="primary"
                                                            type="button"
                                                            onClick={() => handleTrainingModel()}>
                                                            <span className="btn-inner--icon mr-0">
                                                                <i className="fas fa-dumbbell"></i>
                                                            </span>
                                                            <span className="btn-inner--text d-none d-lg-inline">
                                                            {!processing.training ? " Train Model" : " Training.."}</span>
                                                                {processing.training ? (
                                                                    <Spinner
                                                                    style={{ width: "0.7rem", height: "0.7rem" }}
                                                                    type="grow"
                                                                    color="light"
                                                                    />
                                                                ):null}
                                                        </Button>
                                                    </FormGroup>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <div id="BatchGraph"></div>
                                                    </Col>
                                                </Row>  
                                                <Row>
                                                    <Col>
                                                        <div id="EpochGraph"></div>
                                                    </Col>
                                                </Row>
                                            </Col>
                                    </CardBody>
                                </Card>
                                </div>
                                <Card>
                                    <CardHeader><i className="fas fa-stethoscope"></i> 4 - Test the Model</CardHeader>
                                    <CardBody>
                                        <CardSubtitle className="mb-2 text-muted">Last step is test the model with new data.</CardSubtitle>
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
                                            <Row>&nbsp;</Row>
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
                                            <Row>&nbsp;</Row>
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
