FROM node:10.15.3

RUN apt-get update
RUN apt-get install -y pkg-config zip g++ zlib1g-dev unzip python git wget

RUN wget https://github.com/bazelbuild/bazel/releases/download/0.23.2/bazel-0.23.2-installer-linux-x86_64.sh
RUN chmod +x bazel-0.23.2-installer-linux-x86_64.sh
RUN ./bazel-0.23.2-installer-linux-x86_64.sh --user
RUN export PATH="$PATH:$HOME/bin"

# Create app directory
RUN mkdir -p /home/bazelin
WORKDIR /home/bazelin


COPY ./ ./
RUN npm --unsafe-perm install


CMD ["npm", "run", "bazel-bandle"]
