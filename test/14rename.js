'use strict';

// smaller utility method tests

const chai = require('chai');
const expect = chai.expect;
const chaiSubset = require('chai-subset');
const chaiAsPromised = require('chai-as-promised');
const {config, getConnection} = require('./hooks/global-hooks');
const {renameSetup, renameCleanup} = require('./hooks/rename-hooks');
const {makeRemotePath, lastRemoteDir} = require('./hooks/global-hooks');

chai.use(chaiSubset);
chai.use(chaiAsPromised);

describe('rename() method tests', function () {
  let sftp;

  before('rename setup hook', async function () {
    sftp = await getConnection();
    await renameSetup(sftp, config.sftpUrl);
    return true;
  });

  after('rename cleanup hook', async function () {
    await renameCleanup(sftp, config.sftpUrl);
    return true;
  });

  it('rename should return a promise', function () {
    let from = makeRemotePath(config.sftpUrl, 'rename-promise.md');
    let to = makeRemotePath(config.sftpUrl, 'rename-promise2.txt');
    let p = sftp.rename(from, to);
    expect(p).to.be.a('promise');
    return expect(p).to.eventually.equal(
      `Successfully renamed ${from} to ${to}`
    );
  });

  it('rename non-existent file is rejected', function () {
    return expect(
      sftp.rename(
        makeRemotePath(config.sftpUrl, 'no-such-file.txt'),
        makeRemotePath(config.sftpUrl, 'dummy.md')
      )
    ).to.be.rejectedWith('No such file');
  });

  it('rename file successfully', function () {
    return sftp
      .rename(
        makeRemotePath(config.sftpUrl, 'rename-promise2.txt'),
        makeRemotePath(config.sftpUrl, 'rename-new.md')
      )
      .then(() => {
        return sftp.list(config.sftpUrl);
      })
      .then((list) => {
        return expect(list).to.containSubset([{name: 'rename-new.md'}]);
      });
  });

  it('rename to existing file name is rejected', function () {
    return expect(
      sftp.rename(
        makeRemotePath(config.sftpUrl, 'rename-new.md'),
        makeRemotePath(config.sftpUrl, 'rename-conflict.md')
      )
    ).to.be.rejectedWith('Permission denied');
  });

  it('rename with relative source 1', function () {
    return sftp
      .rename(
        './testServer/rename-new.md',
        makeRemotePath(config.sftpUrl, 'rename-relative1.md')
      )
      .then(() => {
        return sftp.list(config.sftpUrl);
      })
      .then((list) => {
        return expect(list).to.containSubset([{name: 'rename-relative1.md'}]);
      });
  });

  it('rename with relative source 2', function () {
    let remotePath = makeRemotePath(
      '..',
      lastRemoteDir(config.remoteRoot),
      'testServer',
      'rename-relative1.md'
    );
    return sftp
      .rename(remotePath, makeRemotePath(config.sftpUrl, 'rename-relative2.md'))
      .then(() => {
        return sftp.list(config.sftpUrl);
      })
      .then((list) => {
        return expect(list).to.containSubset([{name: 'rename-relative2.md'}]);
      });
  });

  it('rename with relative destination 3', function () {
    let remotePath = makeRemotePath(
      '..',
      lastRemoteDir(config.remoteRoot),
      'testServer',
      'rename-relative3.md'
    );
    return sftp
      .rename(makeRemotePath(config.sftpUrl, 'rename-relative2.md'), remotePath)
      .then(() => {
        return sftp.list(config.sftpUrl);
      })
      .then((list) => {
        return expect(list).to.containSubset([{name: 'rename-relative3.md'}]);
      });
  });

  it('rename with relative destination 4', function () {
    let remotePath = makeRemotePath(
      '..',
      lastRemoteDir(config.remoteRoot),
      'testServer',
      'rename-relative4.md'
    );
    return sftp
      .rename(makeRemotePath(config.sftpUrl, 'rename-relative3.md'), remotePath)
      .then(() => {
        return sftp.list(config.sftpUrl);
      })
      .then((list) => {
        return expect(list).to.containSubset([{name: 'rename-relative4.md'}]);
      });
  });
});
