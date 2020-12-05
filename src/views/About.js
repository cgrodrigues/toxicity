import {
    Card,
    Container,
    Row,
    Col,
    CardBody,
    CardHeader,
    Table
} from "reactstrap"


const About = (props) => {

    let testSentences = ["This is the \nfirst element", 
                         "another element in the array", 
                         "Previous to the last one", 
                         "This isn't the first one",
                         "The tail of the list"];

    // change to lower case
    testSentences = testSentences.map( (str) => {return str.toLowerCase()});

    //Remove stop words
    const stopWords = [ "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "it", "it's", "its", "itself", "let's", "me", "more", "most", "my", "myself", "nor", "of", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "she'd", "she'll", "she's", "should", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "we'd", "we'll", "we're", "we've", "were", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "would", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves" ];


    
    testSentences = testSentences.map( (item) => {
        return stopWords.reduce( (acc, stopWord) => {

            const regex = new RegExp( "^\\s*"+stopWord+"\\s*$|^\\s*"+stopWord+"\\s+|\\s+"+stopWord+"\\s*$|\\s+"+stopWord+"\\s+", "ig");              
            return acc.replace(regex, " ");
        } , item)
        //.replace("'", " ")
        .replace("\n", " ")
        .replace("\\", " ")
        .replace("\\", " ")
        .replace("\b", " ")
        .replace("\f", " ")
        .replace("\r", " ")
        .replace("\t", " ")
        .replace(/\s+/g, " ")
        .trim();
    })
    

    
    //Convert textSentences to testWords
    let testWords = testSentences.map((item) => {return item.split(" ")});

    //create 

    //Print into table
    let printTestWords = testWords.reduce((sAcc, sentence) =>{

        const ret = sentence.reduce( (wAcc, word) => {return <>{wAcc}<td>{word}</td></>}, '');

        return <>{sAcc}<tr>{ret}</tr></>;

    }, '');
    
    return (

        <Container className="pt-2" fluid>
            <Row className="mt-1 mt-md--8">
                <Col className="mb-5 mb-xl-0">
                    <Card className="shadow">
                        <CardHeader className="border-0">
                            <Row className="align-items-center">
                                <div className="col">
                                    <h3 className="pb-1"><i className="fas fa-biohazard"></i> About</h3>
                                </div>
                                <div className="col text-right">
                                </div>
                            </Row>
                        </CardHeader>
                        <CardBody style={{ overflow: "scroll" }}>
                            <Table>{printTestWords}</Table>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );

}

export default About;
