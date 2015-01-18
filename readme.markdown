# remmit
> Reddit API as event emitters

Library that uses event emitters for (semi)realtime Reddit API consumption.

This library is experimental and under heavy development.

## demo

There is a very simple demo script at `demo/index.js`. It simply polls a
thread and prints out comments 5 times and exits. By default it fetches the
[I was mauled by a bear](https://www.reddit.com/comments/1byn1l) AMA thread.
You can pass a different thread ID:

```
$ node demo [id]
```
