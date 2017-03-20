/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Shortcuts to DOM Elements.
var articleForm = document.getElementById('article-form');
var issueForm = document.getElementById('issue-form');
var articleIdInput = document.getElementById('new-post-id');
var articleAuthorIdInput = document.getElementById('new-post-authorId');
var articleoldIssueIdInput = document.getElementById('new-post-oldIssueId');
var articleTitleInput = document.getElementById('new-post-title');
var articleAuthorInput = document.getElementById('new-post-author');
var articleCategoryInput = document.getElementById('new-post-category');
var articleDescriptionInput = document.getElementById('new-post-description');
var articleKeepImageInput = document.getElementById('new-post-keep-image');
var articleKeepImageContainer = document.getElementById('new-post-keep-image-container');
var articleImageInput = document.getElementById('new-post-image');
var articleImageContainer = document.getElementById('new-post-image-container');
var articleTextInput = document.getElementById('new-post-text');
var articleSpinner = document.getElementById('new-post-spinner');
var issueIdInput = document.getElementById('new-issue-id');
var issueTitleInput = document.getElementById('new-issue-title');
var issueDescriptionInput = document.getElementById('new-issue-description');
var issueKeepImageInput = document.getElementById('new-issue-keep-image');
var issueKeepImageContainer = document.getElementById('new-issue-keep-image-container');
var issueImageInput = document.getElementById('new-issue-image');
var issueImageContainer = document.getElementById('new-issue-image-container');
var issueSpinner = document.getElementById('new-issue-spinner');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addArticle = document.getElementById('add-article');
var addIssue = document.getElementById('add-issue');
var issueSelect = document.getElementById('sayilar');
var addButton = document.getElementById('add');
var issuesSection = document.getElementById('issues-list');
var articlesSection = document.getElementById('articles-list');
var usersSection = document.getElementById('users-list');
var issuesMenuButton = document.getElementById('menu-issues');
var articlesMenuButton = document.getElementById('menu-articles');
var usersMenuButton = document.getElementById('menu-users');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
function newArticle(key, issueId, oldIssueId, authorId, title, author, category, description, picUrl, body, changePic) {
  // Get a key for a new Post.
  if (!key) {
    key = firebase.database().ref('/yazilar/').push().key;
  }

  //Capitalize categories.
  if (category.length > 0) {
    category = category.charAt(0).toUpperCase() + category.slice(1);
  }

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  if (oldIssueId && oldIssueId !== issueId)
    updates['/sayilar/' + oldIssueId + '/articles/' + key] = null;
  updates['/sayilar/' + issueId + '/articles/' + key] = category;
  updates['/yazilar/' + key + '/key'] = key;
  updates['/yazilar/' + key + '/issueId'] = issueId;
  if (authorId)
    updates['/yazilar/' + key + '/authorId'] = authorId;
  else
    updates['/yazilar/' + key + '/authorId'] = firebase.auth().currentUser.uid;
  updates['/yazilar/' + key + '/title'] = title;
  updates['/yazilar/' + key + '/author'] = author;
  updates['/yazilar/' + key + '/category'] = category;
  updates['/yazilar/' + key + '/description'] = description;
  updates['/yazilar/' + key + '/body'] = body;
  if (changePic || picUrl) {
    updates['/yazilar/' + key + '/imageUrl'] = picUrl;
  }
  //updates['/sayilar/' + issueId + '/' + newPostKey] = postData;

  var authors = author.split(",");
  authors.forEach(function(name) {
    while (name.charAt(0) == " ") {
      name = name.slice(1);
    }
    while (name.length > 0 && name.charAt(name.length - 1) == " ") {
      name = name.substring(0, name.length - 1);
    }
    updates['/yazarlar/' + name + '/' + key] = true;
  })

  return firebase.database().ref().update(updates);
}

function newIssue(key, title, description, picUrl, changePic) {
  // Get a key for a new Post.
  if (!key)
    key = firebase.database().ref('/sayilar/').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/sayilar/' + key + '/key'] = key;
  updates['/sayilar/' + key + '/title'] = title;
  updates['/sayilar/' + key + '/description'] = description;
  if (changePic || picUrl)
    updates['/sayilar/' + key + '/imageUrl'] = picUrl;

  //updates['/sayilar/' + issueId + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}

/**
 * Creates an article element.
 */
function createArticleElement(postId, authorId, issueId, title, author, category, description, imageUrl, text, isPublished) {
  // Create the DOM element from the HTML.
  var postElement = document.getElementById('articles-table').getElementsByTagName('thead')[0].insertRow(-1);
  postElement.classList.add('article-'+postId);
  editArticleElement(postElement, postId, authorId, issueId, title, author, category, description, imageUrl, text, isPublished);
  return postElement;
}

function editArticleElement(postElement, postId, authorId, issueId, title, author, category, description, imageUrl, text, isPublished) {
  var uid = firebase.auth().currentUser.uid;

  var html =    '<th class="mdl-data-table__cell--non-numeric issue"></th>' +
                '<th class="title">'+ (title || 'BAŞLIK YOK') +'</th>' +
                '<th class="author">'+ (author || 'YAZAR YOK') +'</th>' +
                '<th class="category">'+ (category || '') +'</th>' +
                '<th class="description">'+ (description?'<button class="mdl-button mdl-js-button mdl-button--icon descriptionButton"><i class="material-icons">subject</i></button>':'') +'</th>' +
                '<th class="imageUrl">'+ (imageUrl?'<button class="mdl-button mdl-js-button mdl-button--icon imageButton"><i class="material-icons">image</i></button>':'') +'</th>' +
                '<th class="text"><button class="mdl-button mdl-js-button mdl-button--icon textButton"><i class="material-icons">subject</i></button></th>' +
                '<th class="publish">' +
                  '<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="article-switch-'+postId+'">' +
                    '<input type="checkbox" id="article-switch-'+postId+'" class="mdl-switch__input" >' +
                    '<span class="mdl-switch__label"></span>' +
                  '</label>' +
              '</th>' +
              '<th class="mdl-data-table__cell--non-numeric edit"></th>' +
              '<th class="mdl-data-table__cell--non-numeric delete"></th>';

    postElement.innerHTML = html;
    // Set values.
    firebase.database().ref("/sayilar/"+issueId+"/title").once("value", (snapshot) => {
      postElement.getElementsByClassName('issue')[0].innerText = snapshot.val() || 'SAYI YOK';
    });

    if (imageUrl) {
      postElement.getElementsByClassName('imageButton')[0].onclick = () => {
        //showImageDialog(title, imageUrl);
        window.open(imageUrl);
      };
    }

    if (description) {
      postElement.getElementsByClassName('descriptionButton')[0].onclick = () => {
        showViewDialog(title, description);
      };
    }

    postElement.getElementsByClassName('textButton')[0].onclick = () => {
      showViewDialog(title, text);
    };

    firebase.database().ref('/sayilar/'+issueId+'/articles/'+postId).on('value', (data) => {
      var publishCheck = document.getElementById('article-switch-'+postId);
      if (data.val()) {
        publishCheck.checked = true;
      } else {
        publishCheck.checked = false;
      }
    });

    firebase.database().ref('/kullanicilar/'+uid+'/').once('value', (data) => {
      var publishCheck = document.getElementById('article-switch-'+postId);
      if (!data.val().isAdmin) {
        publishCheck.disabled = true;
      } else {
        publishCheck.disabled = false;
        publishCheck.addEventListener('click', () => {
          var updates = {};
          var pub = publishCheck.checked;
          if (pub) {
            updates['/sayilar/'+issueId+'/articles/'+postId] = true;
          } else {
            updates['/sayilar/'+issueId+'/articles/'+postId] = null;
          }
          //updates['/yazilar/'+postId+'/publish'] = publishCheck.checked;
          firebase.database().ref().update(updates);
        });
        if (componentHandler) {
          componentHandler.upgradeElements(postElement);
        }

        postElement.getElementsByClassName('delete')[0].innerHTML = '<button class="mdl-button mdl-js-button mdl-button--icon deleteButton"><i class="material-icons">delete</i></button>';
        postElement.getElementsByClassName('deleteButton')[0].onclick = () => {
          var ok = confirm(title + "'ı silmek istediğinizden emin misiniz?");
          if (ok) {
            firebase.database().ref('/yazilar/' + postId).remove().then((val) => {
              console.log('Removed article ' + title);
            });
          }
        };
      }

      if (data.val().isAdmin || (data.val().isEditor && uid == authorId && !isPublished)) {
        postElement.getElementsByClassName('edit')[0].innerHTML = '<button class="mdl-button mdl-js-button mdl-button--icon editButton"><i class="material-icons">mode_edit</i></button>';
        postElement.getElementsByClassName('editButton')[0].onclick = () => {
          showSection(addArticle);
          articleForm.reset();
          articleImageContainer.style.display = 'none';
          articleKeepImageContainer.style.display =  '';
          articleKeepImageContainer.checked = false;
          articleIdInput.value = postId;
          articleAuthorIdInput.value = authorId;
          articleoldIssueIdInput.value = issueId;
          issueSelect.value = issueId;
          articleTitleInput.value = title;
          articleAuthorInput.value = author;
          articleCategoryInput.value = category;
          articleDescriptionInput.value = description;
          articleTextInput.value = text;
        };
      }
    });
    setTimeout(() => {
      if (componentHandler) {
        componentHandler.upgradeElements(postElement);
      }
    }, 200);
}

/**
 * Creates a issue element.
 */
function createIssueElement(issueId, title, description, imageUrl, isPublished) {
  // Create the DOM element from the HTML.
  var postElement = document.getElementById('issues-table').getElementsByTagName('thead')[0].insertRow(-1);
  postElement.classList.add('issue-'+issueId);

  editIssueElement(postElement, issueId, title, description, imageUrl, isPublished);

  return postElement;
}

function editIssueElement(postElement, issueId, title, description, imageUrl, isPublished) {
  var uid = firebase.auth().currentUser.uid;

  var html =  '<th class="mdl-data-table__cell--non-numeric title">'+ title +'</th>' +
              '<th class="mdl-data-table__cell--non-numeric description">'+ (description?'<button class="mdl-button mdl-js-button mdl-button--icon descriptionButton"><i class="material-icons">subject</i></button>':'') +'</th>' +
              '<th class="mdl-data-table__cell--non-numeric imageUrl">'+ (imageUrl?'<button class="mdl-button mdl-js-button mdl-button--icon imageButton"><i class="material-icons">image</i></button>':'') +'</th>' +
              '<th class="mdl-data-table__cell--non-numeric publish">' +
                '<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="issue-switch-'+issueId+'">' +
                  '<input type="checkbox" id="issue-switch-'+issueId+'" class="mdl-switch__input" '+ (isPublished?'checked':'') +'>' +
                  '<span class="mdl-switch__label"></span>' +
                '</label>' +
              '</th>' +
              '<th class="mdl-data-table__cell--non-numeric edit"></th>' +
              '<th class="mdl-data-table__cell--non-numeric delete"></th>';

  postElement.innerHTML = html;

  if (imageUrl) {
    postElement.getElementsByClassName('imageButton')[0].onclick = () => {
      //showImageDialog(title, imageUrl);
      window.open(imageUrl);
    };
  }

  if (description) {
    postElement.getElementsByClassName('descriptionButton')[0].onclick = () => {
      showViewDialog(title, description);
    };
  }

  firebase.database().ref('/kullanicilar/'+uid+'/').once('value', (data) => {
    var publishCheck = document.getElementById('issue-switch-'+issueId);
    if (!data.val().isAdmin) {
      publishCheck.disabled = true;
    } else {
      publishCheck.disabled = false;
      publishCheck.addEventListener('click', () => {
        var updates = {};
        updates['/sayilar/'+issueId+'/publish'] = publishCheck.checked;
        firebase.database().ref().update(updates);
        if (componentHandler) {
          componentHandler.upgradeElements(postElement);
        }
      });

      postElement.getElementsByClassName('edit')[0].innerHTML = '<button class="mdl-button mdl-js-button mdl-button--icon editButton"><i class="material-icons">mode_edit</i></button>';
      postElement.getElementsByClassName('editButton')[0].onclick = () => {
        showSection(addIssue);
        issueForm.reset();
        issueImageContainer.style.display = 'none';
        issueKeepImageContainer.style.display =  '';
        issueKeepImageContainer.checked = false;
        issueIdInput.value = issueId;
        issueTitleInput.value = title;
        issueDescriptionInput.value = description;
      };

      postElement.getElementsByClassName('delete')[0].innerHTML = '<button class="mdl-button mdl-js-button mdl-button--icon deleteButton"><i class="material-icons">delete</i></button>';
      postElement.getElementsByClassName('deleteButton')[0].onclick = () => {
        var ok = confirm(title + "'ı silmek istediğinizden emin misiniz?");
        if (ok) {
          var alsoArticles = confirm("Bağlantılı yazılar da silinsin mi?");
          if (alsoArticles) {
            var query = firebase.database().ref('/yazilar/').orderByChild('issueId').startAt(issueId).endAt(issueId).limitToLast(1);
            query.on('child_added', (data) => {
              data.ref.remove().then(() => {
                console.log('Removed article ' + data.val().title);
              });
            });
          }
          var query2 = firebase.database().ref('/sayilar/' + issueId).remove().then((val) => {
            console.log('Removed issue ' + title);
          });
        }
      };
    }
  });

  setTimeout(() => {
    if (componentHandler) {
      componentHandler.upgradeElements(postElement);
    }
  }, 200);
}

/**
 * Creates a user element.
 */
function createUserElement(userId, username, email, imageUrl, isAdmin, isEditor) {
  // Create the DOM element from the HTML.
  var postElement = document.getElementById('users-table').getElementsByTagName('thead')[0].insertRow(-1);
  postElement.classList.add('user-'+userId);

  editUserElement(postElement, userId, username, email, imageUrl, isAdmin, isEditor);

  return postElement;
}

function editUserElement(postElement, userId, username, email, imageUrl, isAdmin, isEditor) {
  var uid = firebase.auth().currentUser.uid;

  var html =  '<th class="mdl-data-table__cell--non-numeric username"><div class="avatar"></div><div class="username">'+ username +'</div></th>' +
              '<th class="mdl-data-table__cell--non-numeric email">'+ (email || '') +'</th>' +
              '<th class="mdl-data-table__cell--non-numeric isAdmin">' +
                '<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="user-admin-'+userId+'">' +
                  '<input type="checkbox" id="user-admin-'+userId+'" class="mdl-switch__input" disabled '+ (isAdmin?'checked':'') +'>' +
                  '<span class="mdl-switch__label"></span>' +
                '</label>' +
              '</th>' +
              '<th class="mdl-data-table__cell--non-numeric isEditor">' +
                '<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="user-editor-'+userId+'">' +
                  '<input type="checkbox" id="user-editor-'+userId+'" class="mdl-switch__input" disabled '+ (isEditor?'checked':'') +'>' +
                  '<span class="mdl-switch__label"></span>' +
                '</label>'
              '</th>';

  postElement.innerHTML = html;

  postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
      (imageUrl || './silhouette.jpg') + '")';

  firebase.database().ref('/kullanicilar/'+uid+'/isAdmin').once('value', (data) => {
    if (data.val()) {
      if (uid !== userId) {
        var adminCheck = document.getElementById('user-admin-'+userId);
        adminCheck.disabled = false;
        adminCheck.addEventListener('click', () => {
          var updates = {};
          updates['/kullanicilar/'+userId+'/isAdmin'] = adminCheck.checked;
          firebase.database().ref().update(updates);
        });
      }

      var editorCheck = document.getElementById('user-editor-'+userId);
      editorCheck.disabled = false;
      editorCheck.addEventListener('click', () => {
        var updates = {};
        updates['/kullanicilar/'+userId+'/isEditor'] = editorCheck.checked;
        firebase.database().ref().update(updates);
      });

      if (componentHandler) {
        componentHandler.upgradeElements(postElement);
      }
    }
  });

  setTimeout(() => {
    if (componentHandler) {
      componentHandler.upgradeElements(postElement);
    }
  }, 200);
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  var myUserId = firebase.auth().currentUser.uid;
  var issuesRef = firebase.database().ref('/sayilar/');
  var articlesRef = firebase.database().ref('/yazilar/').orderByChild('issueId');
  var usersRef = firebase.database().ref('/kullanicilar/').orderByChild('username');

  var fetchArticles = function(postsRef) {
    postsRef.on('child_added', function(data) {
      createArticleElement(data.key, data.val().authorId, data.val().issueId, data.val().title, data.val().author, data.val().category, data.val().description, data.val().imageUrl, data.val().body);
    });
    postsRef.on('child_changed', function(data) {
      var postElement = articlesSection.getElementsByClassName('article-' + data.key)[0];
      editArticleElement(postElement, data.key, data.val().authorId, data.val().issueId, data.val().title, data.val().author, data.val().category, data.val().description, data.val().imageUrl, data.val().body);
      /*
      firebase.database().ref("/sayilar/"+data.val().issueId+"/title").once("value", (snapshot) => {
        postElement.getElementsByClassName('issue')[0].innerText = snapshot.val() || 'SAYI YOK';
      });
      postElement.getElementsByClassName('title')[0].innerText = data.val().title;
      postElement.getElementsByClassName('author')[0].innerText = data.val().author;
      postElement.getElementsByClassName('category')[0].innerText = data.val().category;
      postElement.getElementsByClassName('description')[0].innerHTML = data.val().description?'<button class="mdl-button mdl-js-button mdl-button--icon descriptionButton"><i class="material-icons">subject</i></button>':'';
      postElement.getElementsByClassName('imageUrl')[0].innerHTML = data.val().imageUrl?'<button class="mdl-button mdl-js-button mdl-button--icon imageButton"><i class="material-icons">image</i></button>':'';
      if (data.val().imageUrl) {
        postElement.getElementsByClassName('imageButton')[0].onclick = () => {
          window.open(data.val().imageUrl);
        };
      }
      if (data.val().description) {
        postElement.getElementsByClassName('descriptionButton')[0].onclick = () => {
          showViewDialog(data.val().title, data.val().description);
        };
      }
      postElement.getElementsByClassName('textButton')[0].onclick = () => {
        showViewDialog(data.val().title, data.val().body);
      };
      document.getElementById('article-switch-'+data.key).checked = data.val().publish;
      var editButton = postElement.getElementsByClassName('editButton')[0];
      if (editButton) {
        editButton.onclick = () => {
          showSection(addArticle);
          articleForm.reset();
          articleImageContainer.style.display = 'none';
          articleKeepImageContainer.style.display =  '';
          articleKeepImageContainer.checked = false;
          articleIdInput.value = data.key;
          articleAuthorIdInput.value = data.val().authorId;
          articleoldIssueIdInput.value = data.val().issueId;
          issueSelect.value = data.val().issueId;
          articleTitleInput.value = data.val().title;
          articleAuthorInput.value = data.val().author;
          articleCategoryInput.value = data.val().category;
          articleDescriptionInput.value = data.val().description;
          articleTextInput.value = data.val().body;
        };
      }
      */
    });
    postsRef.on('child_removed', function(data) {
      var postElement = articlesSection.getElementsByClassName('article-' + data.key)[0];
      postElement.parentElement.removeChild(postElement);
    });
  }

  var fetchIssues = function(postsRef) {
    postsRef.on('child_added', function(data) {
      var containerElement = issuesSection.getElementsByClassName('issues-container')[0];
      // containerElement.insertBefore(
      //     createIssueElement(data.key, data.val().title, data.val().description, data.val().imageUrl, data.val().publish),
      //     containerElement.firstChild);
      createIssueElement(data.key, data.val().title, data.val().description, data.val().imageUrl, data.val().publish);
      var option = document.createElement('option');
      option.value = data.key;
      option.innerText = (data.val().title || 'Sayı ' + data.key);
      issueSelect.appendChild(option);
    });
    postsRef.on('child_changed', function(data) {
      var postElement = issuesSection.getElementsByClassName('issue-' + data.key)[0];
      editIssueElement(postElement, data.key, data.val().title, data.val().description, data.val().imageUrl, data.val().publish);
      /*
      postElement.getElementsByClassName('title')[0].innerText = data.val().title;
      postElement.getElementsByClassName('description')[0].innerHTML = data.val().description?'<button class="mdl-button mdl-js-button mdl-button--icon descriptionButton"><i class="material-icons">subject</i></button>':'';
      postElement.getElementsByClassName('imageUrl')[0].innerHTML = data.val().imageUrl?'<button class="mdl-button mdl-js-button mdl-button--icon imageButton"><i class="material-icons">image</i></button>':'';
      if (data.val().imageUrl) {
        postElement.getElementsByClassName('imageButton')[0].onclick = () => {
          window.open(data.val().imageUrl);
        };
      }
      if (data.val().description) {
        postElement.getElementsByClassName('descriptionButton')[0].onclick = () => {
          showViewDialog(data.val().title, data.val().description);
        };
      }
      document.getElementById('issue-switch-'+data.key).checked = data.val().publish;
      var editButton = postElement.getElementsByClassName('editButton')[0];
      if (editButton) {
        editButton.onclick = () => {
          showSection(addIssue);
          issueForm.reset();
          issueImageContainer.style.display = 'none';
          issueKeepImageContainer.style.display =  '';
          issueKeepImageContainer.checked = false;
          issueIdInput.value = data.val().issueId;
          issueTitleInput.value = data.val().title;
          issueDescriptionInput.value = data.val().description;
        };
      }
      */
    });
    postsRef.on('child_removed', function(data) {
      var postElement = issuesSection.getElementsByClassName('issue-' + data.key)[0];
      postElement.parentElement.removeChild(postElement);
    });
  }

  var fetchUsers = function(postsRef) {
    postsRef.on('child_added', function(data) {
      createUserElement(data.key, data.val().username, data.val().email, data.val().profile_picture, data.val().isAdmin, data.val().isEditor);
    });
    postsRef.on('child_changed', function(data) {
      var postElement = usersSection.getElementsByClassName('user-' + data.key)[0];
        editUserElement(postElement, data.key, data.val().username, data.val().email, data.val().profile_picture, data.val().isAdmin, data.val().isEditor);
      /*
      postElement.getElementsByClassName('username')[0].innerHTML = '<div class="avatar"></div><div class="username">'+ data.val().username + '</div>';
      postElement.getElementsByClassName('email')[0].innerText = data.val().email;
      document.getElementById('user-admin-'+data.key).checked = data.val().isAdmin;
      document.getElementById('user-editor-'+data.key).checked = data.val().isEditor;
      postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
          (data.val().profile_picture || './silhouette.jpg') + '")';
      */
    });
    postsRef.on('child_removed', function(data) {
      var postElement = usersSection.getElementsByClassName('article-' + data.key)[0];
      postElement.parentElement.removeChild(postElement);
    });
  }

  // Fetching and displaying all posts of each sections.
  //fetchPosts(topUserPostsRef, usersSection);
  //fetchPosts(recentPostsRef, issuesSection);
  //fetchPosts(userPostsRef, articlesSection);
  fetchArticles(articlesRef);
  fetchIssues(issuesRef);
  fetchUsers(usersRef);

  // Keep track of all Firebase refs we are listening to.
  //listeningFirebaseRefs.push(topUserPostsRef);
  //listeningFirebaseRefs.push(recentPostsRef);
  //listeningFirebaseRefs.push(userPostsRef);
  listeningFirebaseRefs.push(articlesRef);
  listeningFirebaseRefs.push(issuesRef);
  listeningFirebaseRefs.push(usersRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  var updates = {};
  updates['/kullanicilar/'+userId+'/username/'] = name;
  updates['/kullanicilar/'+userId+'/email/'] = email;
  updates['/kullanicilar/'+userId+'/profile_picture/'] = imageUrl;
  firebase.database().ref().update(updates);
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
  document.getElementById('issues-container').innerHTML = '';
  document.getElementById('articles-container').innerHTML = '';
  document.getElementById('users-container').innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
    firebase.database().ref('/kullanicilar/'+currentUID+'/').once('value', (data) => {
        if (data.val().isEditor || data.val().isAdmin)
          addButton.style.display = '';
        if (data.val().isAdmin) {
          issuesMenuButton.onclick = function() {
            showSection(issuesSection, issuesMenuButton);
            addButton.style.visibility = 'visible';
          };
        } else {
          issuesMenuButton.onclick = function() {
            showSection(issuesSection, issuesMenuButton);
            addButton.style.visibility = 'hidden';
          };
        }
        if (data.val().isEditor) {
          articlesMenuButton.onclick = function() {
            showSection(articlesSection, articlesMenuButton);
            addButton.style.visibility = 'visible';
          }
        } else {
          articlesMenuButton.onclick = function() {
            showSection(articlesSection, articlesMenuButton);
            addButton.style.visibility = 'hidden';
          }
        }
        issuesMenuButton.onclick();
    });
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

function uploadPicture(picture) {
  var storageRef = firebase.storage().ref();

  var metadata = {
    'contentType': picture.type
  };

  return storageRef.child('images/' + picture.name).put(picture, metadata);
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  issuesSection.style.display = 'none';
  articlesSection.style.display = 'none';
  usersSection.style.display = 'none';
  addArticle.style.display = 'none';
  addIssue.style.display = 'none';
  issuesMenuButton.classList.remove('is-active');
  articlesMenuButton.classList.remove('is-active');
  usersMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

function showViewDialog (title, content) {
    var dialog = document.querySelector('dialog');
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    dialog.querySelector('.close').addEventListener('click', function() {
      dialog.close();
    });
    dialog.getElementsByClassName('mdl-dialog__title')[0].innerText = title;
    dialog.getElementsByClassName('mdl-dialog__content')[0].innerText = content;
    dialog.showModal();
}

function showImageDialog (title, imageUrl) {
    var dialog = document.querySelector('dialog');
    if (!dialog.showModal) {
      dialogPolyfill.registerDialog(dialog);
    }
    dialog.querySelector('.close').addEventListener('click', function() {
      dialog.close();
    });
    dialog.getElementsByClassName('mdl-dialog__title')[0].innerText = title;
    dialog.getElementsByClassName('mdl-dialog__content')[0].innerHTML = '<img alt="'+ title +'" src="'+ imageUrl +'" />';
    dialog.showModal();
}

// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  articleForm.onsubmit = function(e) {
    e.preventDefault();
    var articleId = articleIdInput.value;
    var authorId = articleAuthorIdInput.value;
    var oldIssueId = articleoldIssueIdInput.value;
    var issue = issueSelect.value;
    var title = articleTitleInput.value;
    var author = articleAuthorInput.value;
    var category = articleCategoryInput.value;
    var description = articleDescriptionInput.value;
    var changeImage = articleKeepImageInput.checked;
    var image = null;
    if (articleImageInput.files.length)
      image = articleImageInput.files[0]
    var text = articleTextInput.value;
    if (text && title && author && issue) {
      articleSpinner.classList.add('is-active');
      if (image) {
        uploadPicture(image).then(function(snapshot) {
            console.log('Uploaded', snapshot.totalBytes, 'bytes.');
            console.log(snapshot.metadata);
            var url = snapshot.metadata.downloadURLs[0];
            newArticle(articleId, issue, oldIssueId, authorId, title, author, category, description, url, text, changeImage).then(function() {
              articleSpinner.classList.remove('is-active');
              articlesMenuButton.click();
            });
        });
      } else {
        newArticle(articleId, issue, oldIssueId, authorId, title, author, category, description, null, text, changeImage).then(function() {
          articleSpinner.classList.remove('is-active');
          articlesMenuButton.click();
        });
      }
    }
  };

  // Saves message on form submit.
  issueForm.onsubmit = function(e) {
    e.preventDefault();
    console.log('issueform submit');
    var issueId = issueIdInput.value;
    var title = issueTitleInput.value;
    var description = issueDescriptionInput.value;
    var changeImage = issueKeepImageInput.checked;
    var image = null;
    if (issueImageInput.files.length)
      image = issueImageInput.files[0]
    console.log('title: '+title+' description: '+description);
    if (title) {
      issueSpinner.classList.add('is-active');
      if (image) {
        uploadPicture(image).then(function(snapshot) {
            console.log('Uploaded', snapshot.totalBytes, 'bytes.');
            console.log(snapshot.metadata);
            var url = snapshot.metadata.downloadURLs[0];
            newIssue(issueId, title, description, url, changeImage).then(function() {
              issueSpinner.classList.remove('is-active');
              issuesMenuButton.click();
            });
        });
      } else {
        newIssue(issueId, title, description, null, changeImage).then(function() {
          issueSpinner.classList.remove('is-active');
          issuesMenuButton.click();
        });
      }
    }
  };

  // Bind menu buttons.
  usersMenuButton.onclick = function() {
    showSection(usersSection, usersMenuButton);
    addButton.style.visibility = 'hidden';
  };

  issueKeepImageInput.addEventListener('click', () => {
    if (issueKeepImageInput.checked) {
      issueImageContainer.style.display = '';
    } else {
      issueImageContainer.style.display = 'none';
    }
  });

  articleKeepImageInput.addEventListener('click', () => {
    if (articleKeepImageInput.checked) {
      articleImageContainer.style.display = '';
    } else {
      articleImageContainer.style.display = 'none';
    }
  });

  addButton.onclick = function() {
    var currentTab = document.getElementsByClassName('mdl-layout__tab is-active')[0]
    if (currentTab && currentTab.id == 'menu-issues') {
      showSection(addIssue);
      // issueTitleInput.value = '';
      // issueDescriptionInput.value = '';
      issueForm.reset();
      issueImageContainer.style.display = '';
      issueKeepImageContainer.style.display =  'none';
      issueKeepImageContainer.checked = true;
    } else if (currentTab && currentTab.id == 'menu-articles'){
      showSection(addArticle);
      articleForm.reset();
      articleImageContainer.style.display = '';
      articleKeepImageContainer.style.display =  'none';
      articleKeepImageContainer.checked = true;
    } else {
      issueForm.reset();
      issueImageContainer.style.display = '';
      issueKeepImageContainer.style.display =  'none';
      issueKeepImageContainer.checked = true;
      articleForm.reset();
      articleImageContainer.style.display = '';
      articleKeepImageContainer.style.display =  'none';
      articleKeepImageContainer.checked = true;
    }
  };
}, false);
