import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import {
  PlusIcon,
  IconButton,
  Table,
  Pane,
  TrashIcon,
  RefreshIcon,
  EditIcon,
  Dialog,
  TextInputField,
  toaster,
} from 'evergreen-ui';
import styles from './Home.scss';
import tvsvg from '../../../../assets/live_tv_white_24dp.svg';

declare global {
  interface Window {
    // eslint-disable-next-line
    electron: any;
  }
}

function Home() {
  const { ipcRenderer } = window.electron; // eslint-disable-next-line

  const [playlist, setPlaylist] = useState<
    {
      id: number;
      title: string;
      createdAt: Date;
      updatedAt: Date;
      count: number;
    }[]
  >([]);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [tmpPlayList, setTmpPlayList] = useState({
    title: null,
    url: null,
    channels: 0,
  });
  const [invalidTitle, setInvalidTitle] = useState(false);
  const [titleErrorMessage, setTitleErrorMessage] =
    useState<string | null>(null);
  const [invalidUrl, setInvalidUrl] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);

  const addNewPlaylist = () => {
    ipcRenderer
      .invoke('add-new-playlist', {
        url: tmpPlayList.url,
        title: tmpPlayList.title,
      })
      .then((data: string) => {
        toaster.closeAll();
        if (data === 'PLAYLIST_ALREADY_EXISTS') {
          // show alert
          toaster.danger('Playlist with same name already exists');
        } else if (data === 'PLAYLIST_CREATED') {
          setShowAddPlaylistModal(false);
          setTmpPlayList({
            title: null,
            url: null,
            channels: 0,
          });
          toaster.success('Playlist added');
        } else if (data === 'PLAYLIST_PARSING_FAILED') {
          toaster.warning('Failed to get playlist');
        } else {
          // something went wrong
          toaster.danger('Something went wrong');
        }
        return null;
      })
      .catch((e: Error) => console.log(e));
  };

  const fetchAllPlaylists = () => {
    ipcRenderer
      .invoke('fetch-all-playlists')
      .then(
        (
          data: {
            id: number;
            title: string;
            createdAt: Date;
            updatedAt: Date;
            count: number;
          }[]
        ) => {
          if (!data) {
            setPlaylist([]);
          } else {
            setPlaylist(data);
          }
          return null;
        }
      )
      .catch((e: Error) => console.log(e));
  };

  const deletePlaylist = (id: number) => {
    ipcRenderer
      .invoke('delete-playlist', id)
      .then((result: string) => {
        if (result === 'PLAYLIST_DELETED') {
          fetchAllPlaylists();
        }
        return null;
      })
      .catch((error: Error) => console.log(error));
  };

  useEffect(() => {
    fetchAllPlaylists();
  }, []);

  return (
    <div className={styles.home}>
      <div className={styles.top}>
        <img src={tvsvg} alt="tvlogo" className={styles.tvlogo} />
        <h1 className={styles.title}>IPTV</h1>
      </div>
      <div className={styles.addToPlaylistContainer}>
        <IconButton
          icon={<PlusIcon style={{ fill: 'white' }} size={50} />}
          className={styles.addToPlaylistBtn}
          size="large"
          appearance="primary"
          onClick={() => setShowAddPlaylistModal(true)}
        />
      </div>
      <div className={styles.breakline}>
        <hr />
      </div>
      <div className={styles.bottom}>
        <Table className={styles.playlistTable}>
          <Table.Head fontSize="medium" padding={0}>
            <Table.SearchHeaderCell />
            <Table.TextHeaderCell>Channels</Table.TextHeaderCell>
            <Table.TextHeaderCell>Created</Table.TextHeaderCell>
            <Table.TextHeaderCell>Updated</Table.TextHeaderCell>
            <Table.TextHeaderCell>Modify</Table.TextHeaderCell>
          </Table.Head>
          <Table.Body height="fit-content" maxHeight="300px" border="none">
            {playlist.map((p) => (
              <Table.Row
                key={p.id}
                onSelect={() => {}}
                isSelectable
                className={styles.tableCell}
              >
                <Table.TextCell>{p.title}</Table.TextCell>
                <Table.TextCell>{p.count}</Table.TextCell>
                <Table.TextCell>{p.createdAt}</Table.TextCell>
                <Table.TextCell>{p.updatedAt}</Table.TextCell>
                <Table.TextCell>
                  <Pane display="flex" alignItems="center">
                    <IconButton
                      icon={RefreshIcon}
                      intent="success"
                      marginRight="13px"
                    />
                    <IconButton
                      icon={EditIcon}
                      intent="warning"
                      marginRight="13px"
                    />
                    <IconButton
                      icon={TrashIcon}
                      intent="danger"
                      marginRight="13px"
                      onClick={() => {
                        deletePlaylist(p.id);
                      }}
                    />
                  </Pane>
                </Table.TextCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <Pane alignContent="center">
        <Dialog
          isShown={showAddPlaylistModal}
          title="Add to playlist"
          onConfirm={() => {
            addNewPlaylist();
          }}
          onCancel={() => {
            setTmpPlayList({
              title: null,
              url: null,
              channels: 0,
            });
            setShowAddPlaylistModal(false);
          }}
          confirmLabel="Add"
          isConfirmDisabled={
            invalidTitle || invalidUrl || !tmpPlayList.title || !tmpPlayList.url
          }
          shouldCloseOnOverlayClick={false}
        >
          <TextInputField
            label="Title"
            required
            isInvalid={invalidTitle}
            validationMessage={titleErrorMessage}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidTitle(true);
                setTitleErrorMessage('This field is required');
              } else {
                setTmpPlayList({
                  ...tmpPlayList,
                  title: e.target.value,
                });
                setInvalidTitle(false);
                setTitleErrorMessage(null);
              }
            }}
          />
          <TextInputField
            label="URL"
            hint="Eg. https://iptv.io/index.m3u"
            required
            isInvalid={invalidUrl}
            validationMessage={urlErrorMessage}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidUrl(true);
                setUrlErrorMessage('This field is required');
              } else if (!value.match(/^https?:\/\/.*\.m3u8?/g)) {
                setInvalidUrl(true);
                setUrlErrorMessage('Invalid format');
              } else {
                setTmpPlayList({
                  ...tmpPlayList,
                  url: e.target.value,
                });
                setInvalidUrl(false);
                setUrlErrorMessage(null);
              }
            }}
          />
        </Dialog>
      </Pane>
    </div>
  );
}

export default Home;