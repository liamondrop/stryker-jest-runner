import * as chai from 'chai';
import JestTestRunner from '../../src/JestTestRunner';
import { RunnerOptions, RunResult, RunStatus, TestStatus } from 'stryker-api/test_runner';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
let expect = chai.expect;

describe('JestTestRunner', function () {
    let sut: JestTestRunner;
    this.timeout(10000);

    let expectToHaveSuccessfulTests = (result: RunResult, n: number) => {
        expect(result.tests.filter(t => t.status === TestStatus.Success)).to.have.length(n);
    };

    let expectToHaveFailedTests = (result: RunResult, expectedFailureMessages: string[]) => {
        const actualFailedTests = result.tests.filter(t => t.status === TestStatus.Failed);
        expect(actualFailedTests).to.have.length(expectedFailureMessages.length);
        actualFailedTests.forEach(failedTest => expect(failedTest.failureMessages[0]).to.contain(expectedFailureMessages.shift()));
    };

    describe('when all tests succeed', () => {
        let testRunnerOptions: RunnerOptions;

        before(() => {
            testRunnerOptions = {
                files: [
                    { path: 'testResources/sampleProject/src/Add.js', mutated: true, included: true },
                    { path: 'testResources/sampleProject/src/__tests__/AddSpec.js', mutated: false, included: true } ],
                port: 9877,
                strykerOptions: { logLevel: 'trace' }
            };
        });

        describe('with simple add function to test', () => {
            before(() => {
                sut = new JestTestRunner(testRunnerOptions);
                return sut.init();
            });

            it('should report completed tests', () => {
                return expect(sut.run()).to.eventually.satisfy((runResult: RunResult) => {
                    expectToHaveSuccessfulTests(runResult, 5);
                    expectToHaveFailedTests(runResult, []);
                    expect(runResult.status).to.be.eq(RunStatus.Complete);
                    return true;
                });
            });

            it('should be able to run twice in quick succession',
                () => expect(sut.run().then(() => sut.run())).to.eventually.have.property('status', RunStatus.Complete));
        });
    });

    describe('when some tests fail', () => {
        
        before(() => {
            const testRunnerOptions = {
                files: [
                    { path: 'testResources/sampleProject/src/Add.js', mutated: true, included: true },
                    { path: 'testResources/sampleProject/src/__tests__/AddSpec.js', mutated: false, included: true },
                    { path: 'testResources/sampleProject/src/__tests__/AddFailedSpec.js', mutated: false, included: true } ],
                port: 9878,
                strykerOptions: { logLevel: 'trace' }
            };
            sut = new JestTestRunner(testRunnerOptions);
            return sut.init();
        });

        it('should report failed tests', () => {
            return expect(sut.run()).to.eventually.satisfy((runResult: RunResult) => {
                expectToHaveSuccessfulTests(runResult, 5);
                expectToHaveFailedTests(runResult, [
                    // There seems no way to disable colored output in Jest, so color codes must be included here.
                    'Expected value to be (using ===):\n  \u001b[32m8\u001b[39m\nReceived:\n  \u001b[31m7\u001b[39m\n',
                    'Expected value to be (using ===):\n  \u001b[32m4\u001b[39m\nReceived:\n  \u001b[31m3\u001b[39m\n'
                ]);
                expect(runResult.status).to.be.eq(RunStatus.Complete);
                return true;
            });
    });
  });
});