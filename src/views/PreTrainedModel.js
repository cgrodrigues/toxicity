import React, { useState, useEffect } from "react";
import * as toxicity from '@tensorflow-models/toxicity';
import '@tensorflow/tfjs';

import {
    Card,
    Container,
    Row,
    Col,
    CardBody,
    Form,
    FormGroup,
    Input,
    CardHeader,
    Button,
    Table
} from "reactstrap"


const PreTrainedModel = (props) => {
    const [model, setModel] = useState([]);
    const [textToxicity, setTextToxicity] = useState(undefined);
    const [resultToxicity, setResultToxicity] = useState([]);

    useEffect(() => {
        // Create an scoped async function in the hook
        async function getModel() {
            const th = 0.9;
            
            const m = await toxicity.load(th);
            setModel(m);
        }
        // Execute the created function directly
        getModel();
    }, []);



    function handleTextChange(event) {
        setTextToxicity(event.target.value)
    }

    function classify() {
        model.classify([textToxicity]).then((predictions) => {
            console.log(predictions);
            console.log(predictions.filter((v) => { return v.label === 'toxicity'; })[0].results[0].match);

            setResultToxicity([
                ...resultToxicity,
                {
                    text: textToxicity,
                    identity_attack: predictions.filter((v) => { return v.label === 'identity_attack'; })[0].results[0].match?'True':'False',
                    insult: predictions.filter((v) => { return v.label === 'insult'; })[0].results[0].match?'True':'False',
                    obscene: predictions.filter((v) => { return v.label === 'obscene'; })[0].results[0].match?'True':'False',
                    severe_toxicity: predictions.filter((v) => { return v.label === 'severe_toxicity'; })[0].results[0].match?'True':'False',
                    sexual_explicit: predictions.filter((v) => { return v.label === 'sexual_explicit'; })[0].results[0].match?'True':'False',
                    threat: predictions.filter((v) => { return v.label === 'threat'; })[0].results[0].match?'True':'False',
                    toxicity: predictions.filter((v) => { return v.label === 'toxicity'; })[0].results[0].match?'True':'False',
                }
            ]);

        });
    }

    const tableEntries = resultToxicity.map((el, index) =>

        <tr key={index}>
            <td>{ el.text }</td>
            <td>{ el.identity_attack }</td>
            <td>{ el.insult }</td>
            <td>{ el.obscene }</td>
            <td>{ el.severe_toxicity }</td>
            <td>{ el.sexual_explicit }</td>
            <td>{ el.threat }</td>
            <td>{ el.toxicity }</td>
        </tr>
    );

    return (

        <Container className="pt-2" fluid>
            <Row className="mt-1 mt-md--8">
                <Col className="mb-5 mb-xl-0">
                    <Card className="shadow">
                        <CardHeader className="border-0">
                            <Row className="align-items-center">
                                <div className="col">
                                    
                                    <h5 className="pb-1"><i className="fas fa-biohazard"></i> Toxicity - Pre-Trained Model</h5>
                                </div>
                                <div className="col text-right">

                                </div>
                            </Row>
                        </CardHeader>
                        <CardBody style={{ overflow: "scroll" }}>
                            <Form>
                                <Row>
                                    <Col>


                                    <Table className="align-items-center table-hover" responsive>
                <thead className="thead-light">
                    <tr>
                        <th scope="col">Text</th>
                        <th scope="col">identity attack</th>
                        <th scope="col">insult</th>
                        <th scope="col">obscene</th>
                        <th scope="col">severe toxicity</th>
                        <th scope="col">sexual explicit</th>
                        <th scope="col">threat</th>
                        <th scope="col">toxicity</th>
                    </tr>
                </thead>
                <tbody>
                    { tableEntries }
                </tbody>
                </Table>
                                    </Col>

                                </Row>
                                <Row>

                                    <Col>
                                        <FormGroup>
                                            <label className="form-control-label"
                                                htmlFor="text-toxicity">
                                                Text
                                            </label>
                                            <Input className="text-toxicity"
                                                id="text-toxicity"
                                                placeholder="Text to check"
                                                rows="4"
                                                type="textarea"
                                                onChange={handleTextChange} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                <Col>
                                    <FormGroup>

                                        <Button className="btn-icon"
                                                color="primary"
                                                type="button"
                                                onClick={() => classify() }>
                                            <span className="btn-inner--icon mr-0">
                                                <i className="fas fa-binoculars"></i>
                                            </span>
                                            <span className="btn-inner--text d-none d-lg-inline"> Classify</span>

                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>
                            </Form>
                        </CardBody>

                    </Card>
                </Col>
            </Row>
        </Container>
    );

}

export default PreTrainedModel;
